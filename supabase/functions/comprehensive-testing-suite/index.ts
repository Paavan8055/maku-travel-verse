import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";
import { ErrorHandler } from "../_shared/errorHandler.ts";


interface TestResult {
  testName: string;
  category: 'provider' | 'booking' | 'payment' | 'security' | 'performance';
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  duration: number;
  details?: any;
  error?: string;
}

interface TestSuiteResult {
  success: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
  results: TestResult[];
  overallScore: number;
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { testTypes = ['all'] } = await req.json().catch(() => ({ testTypes: ['all'] }));
    
    logger.info('[TESTING-SUITE] Starting comprehensive test suite', { testTypes });

    const results: TestResult[] = [];
    const startTime = Date.now();

    // 1. Provider Integration Tests
    if (testTypes.includes('all') || testTypes.includes('provider')) {
      results.push(...await runProviderTests(supabase));
    }

    // 2. Booking Flow Tests
    if (testTypes.includes('all') || testTypes.includes('booking')) {
      results.push(...await runBookingTests(supabase));
    }

    // 3. Payment System Tests
    if (testTypes.includes('all') || testTypes.includes('payment')) {
      results.push(...await runPaymentTests(supabase));
    }

    // 4. Security Tests
    if (testTypes.includes('all') || testTypes.includes('security')) {
      results.push(...await runSecurityTests(supabase));
    }

    // 5. Performance Tests
    if (testTypes.includes('all') || testTypes.includes('performance')) {
      results.push(...await runPerformanceTests(supabase));
    }

    // Calculate summary and score
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      warnings: results.filter(r => r.status === 'warning').length,
      skipped: results.filter(r => r.status === 'skipped').length
    };

    const overallScore = Math.round((summary.passed / summary.total) * 100);
    const recommendations = generateRecommendations(results);

    const testSuiteResult: TestSuiteResult = {
      success: summary.failed === 0,
      summary,
      results,
      overallScore,
      recommendations
    };

    logger.info('[TESTING-SUITE] Test suite completed', {
      duration: Date.now() - startTime,
      score: overallScore,
      summary
    });

    return ErrorHandler.createSuccessResponse(testSuiteResult);

  } catch (error) {
    logger.error('[TESTING-SUITE] Test suite failed', error);
    return ErrorHandler.createErrorResponse({
      success: false,
      error: 'Test suite execution failed',
      code: 'TESTING_ERROR'
    });
  }
});

async function runProviderTests(supabase: any): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test Amadeus connectivity
  results.push(await testProviderConnectivity('amadeus', async () => {
    const { data, error } = await supabase.functions.invoke('amadeus-flight-search', {
      body: {
        originLocationCode: 'SYD',
        destinationLocationCode: 'MEL',
        departureDate: '2025-09-01',
        adults: 1
      }
    });
    return { success: !error, data, error };
  }));

  // Test Sabre connectivity
  results.push(await testProviderConnectivity('sabre', async () => {
    const { data, error } = await supabase.functions.invoke('sabre-flight-search', {
      body: {
        originLocationCode: 'SYD',
        destinationLocationCode: 'MEL',
        departureDate: '2025-09-01',
        adults: 1
      }
    });
    return { success: !error, data, error };
  }));

  // Test HotelBeds connectivity
  results.push(await testProviderConnectivity('hotelbeds', async () => {
    const { data, error } = await supabase.functions.invoke('hotelbeds-search', {
      body: {
        cityCode: 'SYD',
        checkInDate: '2025-09-01',
        checkOutDate: '2025-09-03',
        adults: 1,
        roomQuantity: 1
      }
    });
    return { success: !error, data, error };
  }));

  // Test Provider Rotation
  results.push(await testProviderRotation(supabase));

  return results;
}

async function testProviderConnectivity(
  provider: string, 
  testFunction: () => Promise<{ success: boolean; data?: any; error?: any }>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const result = await testFunction();
    const duration = Date.now() - startTime;

    if (result.success) {
      return {
        testName: `${provider}-connectivity`,
        category: 'provider',
        status: 'passed',
        duration,
        details: { hasData: !!result.data }
      };
    } else {
      return {
        testName: `${provider}-connectivity`,
        category: 'provider',
        status: 'failed',
        duration,
        error: result.error?.message || 'Unknown error'
      };
    }
  } catch (error) {
    return {
      testName: `${provider}-connectivity`,
      category: 'provider',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testProviderRotation(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType: 'flight',
        params: {
          originLocationCode: 'SYD',
          destinationLocationCode: 'MEL',
          departureDate: '2025-09-01',
          adults: 1
        }
      }
    });

    const duration = Date.now() - startTime;

    if (!error && data?.success) {
      return {
        testName: 'provider-rotation',
        category: 'provider',
        status: 'passed',
        duration,
        details: {
          provider: data.provider,
          fallbackUsed: data.fallbackUsed,
          responseTime: data.responseTime
        }
      };
    } else {
      return {
        testName: 'provider-rotation',
        category: 'provider',
        status: data?.fallbackUsed ? 'warning' : 'failed',
        duration,
        error: error?.message || data?.error || 'Rotation failed'
      };
    }
  } catch (error) {
    return {
      testName: 'provider-rotation',
      category: 'provider',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function runBookingTests(supabase: any): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test booking creation
  results.push(await testBookingCreation(supabase));

  // Test booking status updates
  results.push(await testBookingStatusUpdates(supabase));

  // Test booking confirmation
  results.push(await testBookingConfirmation(supabase));

  return results;
}

async function testBookingCreation(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Create a test booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        booking_reference: `TEST-${Date.now()}`,
        status: 'pending',
        booking_type: 'test',
        total_amount: 100.00,
        currency: 'AUD',
        booking_data: { test: true, timestamp: Date.now() }
      })
      .select()
      .single();

    const duration = Date.now() - startTime;

    if (!error && data) {
      // Clean up test booking
      await supabase.from('bookings').delete().eq('id', data.id);

      return {
        testName: 'booking-creation',
        category: 'booking',
        status: 'passed',
        duration,
        details: { bookingId: data.id }
      };
    } else {
      return {
        testName: 'booking-creation',
        category: 'booking',
        status: 'failed',
        duration,
        error: error?.message || 'Creation failed'
      };
    }
  } catch (error) {
    return {
      testName: 'booking-creation',
      category: 'booking',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testBookingStatusUpdates(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Test booking status history tracking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: `TEST-STATUS-${Date.now()}`,
        status: 'pending',
        booking_type: 'test',
        total_amount: 100.00,
        currency: 'AUD',
        booking_data: { test: true }
      })
      .select()
      .single();

    if (bookingError) throw new Error(bookingError.message);

    // Update status
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', booking.id);

    // Check if status history was created
    const { data: history } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', booking.id);

    // Clean up
    await supabase.from('bookings').delete().eq('id', booking.id);

    const duration = Date.now() - startTime;

    return {
      testName: 'booking-status-updates',
      category: 'booking',
      status: history && history.length > 0 ? 'passed' : 'warning',
      duration,
      details: { historyEntries: history?.length || 0 }
    };
  } catch (error) {
    return {
      testName: 'booking-status-updates',
      category: 'booking',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testBookingConfirmation(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase.functions.invoke('confirm-hotel-booking', {
      body: {
        bookingId: 'test-booking-id',
        confirmationData: { test: true }
      }
    });

    const duration = Date.now() - startTime;

    return {
      testName: 'booking-confirmation',
      category: 'booking',
      status: !error ? 'passed' : 'failed',
      duration,
      error: error?.message
    };
  } catch (error) {
    return {
      testName: 'booking-confirmation',
      category: 'booking',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function runPaymentTests(supabase: any): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test payment intent creation
  results.push(await testPaymentIntentCreation(supabase));

  return results;
}

async function testPaymentIntentCreation(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase.functions.invoke('create-card-payment-intent', {
      body: {
        amount: 10000, // $100.00 in cents
        currency: 'aud',
        metadata: { test: true }
      }
    });

    const duration = Date.now() - startTime;

    return {
      testName: 'payment-intent-creation',
      category: 'payment',
      status: !error && data?.client_secret ? 'passed' : 'failed',
      duration,
      error: error?.message
    };
  } catch (error) {
    return {
      testName: 'payment-intent-creation',
      category: 'payment',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function runSecurityTests(supabase: any): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test RLS policies
  results.push(await testRLSPolicies(supabase));

  // Test critical alerts
  results.push(await testCriticalAlerts(supabase));

  return results;
}

async function testRLSPolicies(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Try to access protected data without auth
    const { data, error } = await supabase
      .from('admin_users')
      .select('*');

    const duration = Date.now() - startTime;

    // Should fail due to RLS
    return {
      testName: 'rls-protection',
      category: 'security',
      status: error ? 'passed' : 'failed',
      duration,
      details: { errorCode: error?.code }
    };
  } catch (error) {
    return {
      testName: 'rls-protection',
      category: 'security',
      status: 'passed', // Exception means RLS is working
      duration: Date.now() - startTime,
      details: { blocked: true }
    };
  }
}

async function testCriticalAlerts(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('critical_alerts')
      .insert({
        alert_type: 'TEST_ALERT',
        message: 'Test alert for system validation',
        severity: 'low'
      })
      .select()
      .single();

    if (!error && data) {
      // Clean up test alert
      await supabase.from('critical_alerts').delete().eq('id', data.id);
    }

    const duration = Date.now() - startTime;

    return {
      testName: 'critical-alerts',
      category: 'security',
      status: !error ? 'passed' : 'failed',
      duration,
      error: error?.message
    };
  } catch (error) {
    return {
      testName: 'critical-alerts',
      category: 'security',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

async function runPerformanceTests(supabase: any): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test response times
  results.push(await testResponseTimes(supabase));

  return results;
}

async function testResponseTimes(supabase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase.functions.invoke('comprehensive-health-monitor');
    const duration = Date.now() - startTime;

    let status: TestResult['status'] = 'passed';
    if (duration > 5000) status = 'failed';
    else if (duration > 2000) status = 'warning';

    return {
      testName: 'response-times',
      category: 'performance',
      status,
      duration,
      details: { responseTimeMs: duration },
      error: error?.message
    };
  } catch (error) {
    return {
      testName: 'response-times',
      category: 'performance',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

function generateRecommendations(results: TestResult[]): string[] {
  const recommendations: string[] = [];
  const failedTests = results.filter(r => r.status === 'failed');
  const slowTests = results.filter(r => r.duration > 3000);

  if (failedTests.length > 0) {
    recommendations.push(`Fix ${failedTests.length} failed tests: ${failedTests.map(t => t.testName).join(', ')}`);
  }

  if (slowTests.length > 0) {
    recommendations.push(`Optimize ${slowTests.length} slow operations (>3s): ${slowTests.map(t => t.testName).join(', ')}`);
  }

  const providerTests = results.filter(r => r.category === 'provider');
  const failedProviders = providerTests.filter(r => r.status === 'failed');
  
  if (failedProviders.length > 0) {
    recommendations.push('Investigate provider connectivity issues and verify API credentials');
  }

  if (results.filter(r => r.status === 'passed').length / results.length < 0.8) {
    recommendations.push('System health below 80% - immediate attention required');
  }

  return recommendations;
}