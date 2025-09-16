// Test script to validate Supabase Edge Functions deployment
import { supabase } from './src/integrations/supabase/client.js';

console.log('🔍 Testing Supabase Edge Functions deployment...');

async function testDeploymentValidator() {
  console.log('\n📋 Testing deployment-validator function...');
  try {
    const { data, error } = await supabase.functions.invoke('deployment-validator');
    if (error) {
      console.error('❌ Deployment validator error:', error);
    } else {
      console.log('✅ Deployment validator response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Deployment validator exception:', err);
  }
}

async function testCriticalDebug() {
  console.log('\n🛠️ Testing critical-debug function...');
  try {
    const { data, error } = await supabase.functions.invoke('critical-debug');
    if (error) {
      console.error('❌ Critical debug error:', error);
    } else {
      console.log('✅ Critical debug response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Critical debug exception:', err);
  }
}

async function testProviderRotation() {
  console.log('\n🔄 Testing provider-rotation function...');
  try {
    const { data, error } = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType: 'hotel',
        params: {
          destination: 'sydney',
          checkIn: '2025-08-25',
          checkOut: '2025-08-26',
          guests: 2,
          rooms: 1,
          currency: 'AUD'
        }
      }
    });
    if (error) {
      console.error('❌ Provider rotation error:', error);
    } else {
      console.log('✅ Provider rotation response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Provider rotation exception:', err);
  }
}

// Run all tests
async function runTests() {
  await testDeploymentValidator();
  await testCriticalDebug();
  await testProviderRotation();
  console.log('\n🏁 Deployment tests completed!');
}

runTests();