import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const testId = crypto.randomUUID().substring(0, 8);
  console.log(`🧪 [${testId}] Critical Path Test Started`);
  
  const testResults = {
    testId,
    timestamp: new Date().toISOString(),
    overallStatus: 'unknown' as 'pass' | 'fail' | 'partial' | 'unknown',
    tests: {} as Record<string, any>,
    summary: '',
    recommendations: [] as string[]
  };

  try {
    // Test 1: Provider Rotation Function
    console.log(`🔍 [${testId}] Testing provider-rotation function...`);
    const providerRotationTest = await testProviderRotation(testId);
    testResults.tests.providerRotation = providerRotationTest;

    // Test 2: Health Monitor Function
    console.log(`🔍 [${testId}] Testing unified-health-monitor function...`);
    const healthMonitorTest = await testUnifiedHealthMonitor(testId);
    testResults.tests.healthMonitor = healthMonitorTest;

    // Test 3: Individual Provider Functions
    console.log(`🔍 [${testId}] Testing individual provider functions...`);
    const providerTests = await testIndividualProviders(testId);
    testResults.tests.providers = providerTests;

    // Test 4: Database Configuration
    console.log(`🔍 [${testId}] Testing database configuration...`);
    const dbTest = await testDatabaseConfig(testId);
    testResults.tests.database = dbTest;

    // Calculate overall status
    const allTests = [
      providerRotationTest,
      healthMonitorTest,
      ...Object.values(providerTests),
      dbTest
    ];
    
    const passedTests = allTests.filter(t => t.status === 'pass').length;
    const totalTests = allTests.length;
    
    if (passedTests === totalTests) {
      testResults.overallStatus = 'pass';
      testResults.summary = `All ${totalTests} critical path tests passed`;
    } else if (passedTests > totalTests / 2) {
      testResults.overallStatus = 'partial';
      testResults.summary = `${passedTests}/${totalTests} tests passed - partial functionality`;
    } else {
      testResults.overallStatus = 'fail';
      testResults.summary = `${passedTests}/${totalTests} tests passed - critical issues detected`;
    }

    // Generate recommendations
    testResults.recommendations = generateRecommendations(testResults.tests);

    console.log(`✅ [${testId}] Critical Path Test Complete: ${testResults.overallStatus}`);

    return new Response(JSON.stringify(testResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`❌ [${testId}] Critical path test failed:`, error);
    testResults.overallStatus = 'fail';
    testResults.summary = `Test execution failed: ${error.message}`;
    
    return new Response(JSON.stringify(testResults), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testProviderRotation(testId: string) {
  try {
    console.log(`🔄 [${testId}] Testing provider-rotation with minimal hotel search`);
    
    const { data, error } = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType: 'hotel',
        params: {
          destination: 'sydney',
          checkIn: getDateString(1),
          checkOut: getDateString(2),
          guests: 1,
          rooms: 1
        }
      }
    });

    if (error) {
      return {
        test: 'provider-rotation',
        status: 'fail',
        error: error.message,
        duration: 0
      };
    }

    const isSuccess = data?.success === true;
    const hasProvider = !!data?.provider;
    const hasData = !!data?.data;

    return {
      test: 'provider-rotation',
      status: isSuccess ? 'pass' : 'fail',
      details: {
        success: isSuccess,
        provider: data?.provider,
        hasData,
        dataSource: data?.meta?.dataSource,
        resultCount: data?.data?.length || 0
      },
      duration: data?.responseTime || 0
    };

  } catch (error) {
    return {
      test: 'provider-rotation',
      status: 'fail',
      error: error.message,
      duration: 0
    };
  }
}

async function testUnifiedHealthMonitor(testId: string) {
  try {
    console.log(`🏥 [${testId}] Testing unified-health-monitor`);
    
    const { data, error } = await supabase.functions.invoke('unified-health-monitor');

    if (error) {
      return {
        test: 'unified-health-monitor',
        status: 'fail',
        error: error.message,
        duration: 0
      };
    }

    const hasProviders = Array.isArray(data?.providers) && data.providers.length > 0;
    const hasOverallStatus = !!data?.overallStatus;
    const hasSummary = !!data?.summary;

    return {
      test: 'unified-health-monitor',
      status: hasProviders && hasOverallStatus && hasSummary ? 'pass' : 'fail',
      details: {
        overallStatus: data?.overallStatus,
        providerCount: data?.providers?.length || 0,
        healthyProviders: data?.summary?.healthyProviders || 0,
        degradedProviders: data?.summary?.degradedProviders || 0,
        outageProviders: data?.summary?.outageProviders || 0
      }
    };

  } catch (error) {
    return {
      test: 'unified-health-monitor',
      status: 'fail',
      error: error.message,
      duration: 0
    };
  }
}

async function testIndividualProviders(testId: string) {
  const providers = [
    'amadeus-hotel-search',
    'amadeus-flight-search',
    'hotelbeds-search',
    'sabre-hotel-search'
  ];

  const results: Record<string, any> = {};

  for (const provider of providers) {
    try {
      console.log(`🔍 [${testId}] Testing ${provider}`);
      
      const testParams = getProviderTestParams(provider);
      const { data, error } = await supabase.functions.invoke(provider, { body: testParams });

      results[provider] = {
        test: provider,
        status: error ? 'fail' : 'pass',
        error: error?.message,
        hasResults: !!data?.hotels || !!data?.flights || !!data?.data,
        source: data?.source || data?.meta?.dataSource
      };

    } catch (error) {
      results[provider] = {
        test: provider,
        status: 'fail',
        error: error.message
      };
    }
  }

  return results;
}

async function testDatabaseConfig(testId: string) {
  try {
    console.log(`🗄️ [${testId}] Testing database configuration`);
    
    // Test provider_configs table
    const { data: providerConfigs, error: configError } = await supabase
      .from('provider_configs')
      .select('*')
      .limit(5);

    // Test provider_quotas table
    const { data: quotaData, error: quotaError } = await supabase
      .from('provider_quotas')
      .select('*')
      .limit(5);

    return {
      test: 'database-config',
      status: !configError && !quotaError ? 'pass' : 'fail',
      details: {
        providerConfigs: {
          count: providerConfigs?.length || 0,
          error: configError?.message
        },
        quotaData: {
          count: quotaData?.length || 0,
          error: quotaError?.message
        }
      }
    };

  } catch (error) {
    return {
      test: 'database-config',
      status: 'fail',
      error: error.message
    };
  }
}

function getProviderTestParams(provider: string) {
  const tomorrow = getDateString(1);
  const dayAfter = getDateString(2);

  switch (provider) {
    case 'amadeus-hotel-search':
      return {
        destination: 'sydney',
        checkIn: tomorrow,
        checkOut: dayAfter,
        guests: 1,
        rooms: 1
      };
    case 'amadeus-flight-search':
      return {
        origin: 'SYD',
        destination: 'MEL',
        departureDate: tomorrow,
        passengers: 1
      };
    case 'hotelbeds-search':
      return {
        destination: 'sydney',
        checkIn: tomorrow,
        checkOut: dayAfter,
        guests: 1,
        rooms: 1
      };
    case 'sabre-hotel-search':
      return {
        cityCode: 'SYD',
        checkIn: tomorrow,
        checkOut: dayAfter,
        guests: { adults: 1 },
        rooms: 1
      };
    default:
      return {};
  }
}

function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function generateRecommendations(tests: Record<string, any>): string[] {
  const recommendations: string[] = [];
  
  // Check provider rotation
  if (tests.providerRotation?.status === 'fail') {
    recommendations.push('CRITICAL: Provider rotation system is not working - this affects all user searches');
  }
  
  // Check health monitor
  if (tests.healthMonitor?.status === 'fail') {
    recommendations.push('Health monitoring system is down - admin dashboard may show incorrect status');
  }
  
  // Check individual providers
  const providerTests = tests.providers || {};
  const failedProviders = Object.values(providerTests)
    .filter((test: any) => test?.status === 'fail')
    .map((test: any) => test?.test);
    
  if (failedProviders.length > 0) {
    recommendations.push(`Provider functions failing: ${failedProviders.join(', ')} - check Edge Function logs and credentials`);
  }
  
  // Check database
  if (tests.database?.status === 'fail') {
    recommendations.push('Database configuration issues detected - check table structures and permissions');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All critical systems are operational');
  }
  
  return recommendations;
}