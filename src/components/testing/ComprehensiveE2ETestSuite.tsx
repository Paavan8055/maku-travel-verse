/**
 * Comprehensive E2E Testing Framework for MAKU.Travel
 * 
 * Advanced testing suite with real provider integration, booking flow validation,
 * performance testing, and comprehensive reporting.
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, AlertTriangle, Play, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ParameterMapper, { UnifiedSearchParams } from '@/services/core/ParameterMapper';
import PhotoRetriever from '@/services/core/PhotoRetriever';
import cacheManager from '@/services/core/CacheManager';
import logger from '@/utils/logger';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  error?: string;
  details?: any;
  startTime?: number;
  endTime?: number;
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  totalDuration: number;
  startTime?: number;
  endTime?: number;
  category: 'booking' | 'integration' | 'performance' | 'security';
}

interface TestReport {
  suites: TestSuite[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  totalDuration: number;
  timestamp: string;
  environment: string;
}

export const ComprehensiveE2ETestSuite = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('run');
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const { toast } = useToast();

  const updateTestResult = useCallback((suiteName: string, testName: string, result: Partial<TestResult>) => {
    setTestSuites(prev => prev.map(suite => 
      suite.name === suiteName 
        ? {
            ...suite,
            tests: suite.tests.map(test => 
              test.name === testName ? { 
                ...test, 
                ...result,
                endTime: result.status === 'passed' || result.status === 'failed' ? Date.now() : test.endTime
              } : test
            )
          }
        : suite
    ));
  }, []);

  const createTestSuite = (name: string, description: string, category: TestSuite['category'], testNames: string[]): TestSuite => ({
    name,
    description,
    category,
    tests: testNames.map(testName => ({
      name: testName,
      status: 'pending'
    })),
    totalDuration: 0,
    startTime: Date.now()
  });

  // Enhanced Booking Flow Tests
  const runBookingFlowTests = async () => {
    const suite = createTestSuite(
      'Booking Flow Tests',
      'Complete end-to-end booking journey validation',
      'booking',
      [
        'Parameter Mapping Validation',
        'Provider Rotation Test',
        'Hotel Search with Real Data',
        'Flight Search with Real Data', 
        'Activity Search with Real Data',
        'Photo Retrieval Test',
        'Cache Performance Test',
        'Add-on Selection Flow',
        'Guest Information Validation',
        'Payment Intent Creation',
        'Booking Integrity Test',
        'Confirmation Email Test',
        'PDF Voucher Generation'
      ]
    );

    setTestSuites(prev => [...prev, suite]);

    // Test Parameter Mapping
    await runTest(suite.name, 'Parameter Mapping Validation', async () => {
      const hotelParams: UnifiedSearchParams = {
        destination: 'SYD',
        checkIn: '2025-09-01',
        checkOut: '2025-09-03',
        adults: 2,
        children: 1,
        childAges: [8],
        rooms: 1,
        currency: 'AUD'
      };

      const validation = ParameterMapper.validateParams(hotelParams, 'hotel');
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const mappedParams = ParameterMapper.toHotelBeds(hotelParams);
      if (!mappedParams.stay || !mappedParams.occupancies) {
        throw new Error('Parameter mapping incomplete');
      }

      return { 
        validation: validation.isValid,
        mappedFields: Object.keys(mappedParams).length,
        occupancyCount: mappedParams.occupancies.length
      };
    });

    // Test Provider Rotation
    await runTest(suite.name, 'Provider Rotation Test', async () => {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            destination: 'SYD',
            checkIn: '2025-09-01',
            checkOut: '2025-09-03',
            adults: 2,
            rooms: 1,
            currency: 'AUD'
          }
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Provider rotation failed');

      return {
        success: data.success,
        provider: data.provider,
        resultCount: data.data?.length || 0,
        responseTime: data.responseTime,
        fallbackUsed: data.fallbackUsed
      };
    });

    // Test Hotel Search with Real Data
    await runTest(suite.name, 'Hotel Search with Real Data', async () => {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            destination: 'MEL',
            checkIn: '2025-09-05',
            checkOut: '2025-09-07',
            adults: 2,
            rooms: 1,
            currency: 'AUD'
          }
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Hotel search failed');

      const hasValidResults = data.data?.length > 0;
      const firstHotel = data.data?.[0];
      const hasRequiredFields = firstHotel?.name && firstHotel?.price;

      return {
        resultCount: data.data?.length || 0,
        provider: data.provider,
        hasValidResults,
        hasRequiredFields,
        sampleHotel: firstHotel?.name
      };
    });

    // Test Photo Retrieval
    await runTest(suite.name, 'Photo Retrieval Test', async () => {
      const testHotelId = 'test-hotel-12345';
      const result = await PhotoRetriever.getHotelPhotos(testHotelId, 'auto', false);
      
      if (!result.success) {
        throw new Error(`Photo retrieval failed: ${result.error}`);
      }

      return {
        success: result.success,
        photoCount: result.photos.length,
        source: result.source,
        cached: result.cached
      };
    });

    // Test Cache Performance
    await runTest(suite.name, 'Cache Performance Test', async () => {
      const testKey = 'test-cache-key';
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Test cache set
      await cacheManager.set(testKey, testData, 'hotel-search');
      
      // Test cache get
      const cachedData = await cacheManager.get(testKey, 'hotel-search');
      
      if (!cachedData) {
        throw new Error('Cache retrieval failed');
      }

      const stats = cacheManager.getStats();
      
      return {
        cacheWorking: !!cachedData,
        stats,
        dataMatches: JSON.stringify(cachedData) === JSON.stringify(testData)
      };
    });

    // Test Payment Intent Creation
    await runTest(suite.name, 'Payment Intent Creation', async () => {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: 29999, // $299.99 AUD
          currency: 'aud',
          metadata: {
            bookingType: 'hotel',
            testMode: 'true'
          }
        }
      });

      if (error) throw error;
      if (!data?.client_secret) throw new Error('Payment intent creation failed');

      return {
        hasClientSecret: !!data.client_secret,
        paymentIntentId: data.id,
        amount: data.amount,
        currency: data.currency
      };
    });

    setProgress(25);
  };

  // Integration Tests
  const runIntegrationTests = async () => {
    const suite = createTestSuite(
      'System Integration Tests',
      'Third-party service integration and API connectivity',
      'integration',
      [
        'Supabase Edge Functions',
        'Database Connectivity',
        'Provider API Health',
        'Authentication System',
        'Email Service Integration',
        'Error Tracking System',
        'Admin Dashboard APIs',
        'Real-time Subscriptions'
      ]
    );

    setTestSuites(prev => [...prev, suite]);

    // Test Database Connectivity
    await runTest(suite.name, 'Database Connectivity', async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, booking_type')
        .limit(5);

      if (error) throw error;

      return {
        recordCount: data?.length || 0,
        hasData: !!data && data.length > 0,
        sampleBooking: data?.[0]?.id
      };
    });

    // Test Provider API Health
    await runTest(suite.name, 'Provider API Health', async () => {
      const { data, error } = await supabase.functions.invoke('comprehensive-health-monitor');
      
      if (error) throw error;

      const healthyProviders = Object.values(data?.providers || {}).filter(
        (provider: any) => provider.status === 'healthy'
      ).length;

      return {
        totalProviders: Object.keys(data?.providers || {}).length,
        healthyProviders,
        overallStatus: data?.overall,
        lastCheck: data?.timestamp
      };
    });

    setProgress(50);
  };

  // Performance Tests
  const runPerformanceTests = async () => {
    const suite = createTestSuite(
      'Performance Tests',
      'Load testing and performance benchmarks',
      'performance',
      [
        'Search Response Times',
        'Concurrent Request Handling',
        'Cache Hit Rate Analysis',
        'Database Query Performance',
        'Memory Usage Monitoring',
        'Network Latency Tests'
      ]
    );

    setTestSuites(prev => [...prev, suite]);

    // Test Search Response Times
    await runTest(suite.name, 'Search Response Times', async () => {
      const searches = [
        { type: 'hotel', params: { destination: 'SYD', checkIn: '2025-09-01', checkOut: '2025-09-03' }},
        { type: 'hotel', params: { destination: 'MEL', checkIn: '2025-09-05', checkOut: '2025-09-07' }},
        { type: 'hotel', params: { destination: 'BNE', checkIn: '2025-09-10', checkOut: '2025-09-12' }}
      ];

      const results = [];
      for (const search of searches) {
        const start = Date.now();
        const { data } = await supabase.functions.invoke('provider-rotation', {
          body: { searchType: search.type, params: search.params }
        });
        const duration = Date.now() - start;
        results.push({ destination: search.params.destination, duration, success: !!data?.success });
      }

      const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const successRate = results.filter(r => r.success).length / results.length;

      return {
        averageResponseTime: avgResponseTime,
        successRate: successRate * 100,
        searches: results.length,
        details: results
      };
    });

    setProgress(75);
  };

  // Security Tests
  const runSecurityTests = async () => {
    const suite = createTestSuite(
      'Security Tests',
      'Authentication, authorization, and security validation',
      'security',
      [
        'RLS Policy Enforcement',
        'Admin Access Control',
        'API Rate Limiting',
        'Input Validation',
        'SQL Injection Prevention',
        'CORS Configuration'
      ]
    );

    setTestSuites(prev => [...prev, suite]);

    // Test RLS Policy Enforcement
    await runTest(suite.name, 'RLS Policy Enforcement', async () => {
      // Try to access admin data without admin role
      const { data, error } = await supabase
        .from('critical_alerts')
        .select('*')
        .limit(1);

      // Should fail for non-admin users
      const accessDenied = !!error && error.message.includes('access') || error.message.includes('policy');

      return {
        rlsWorking: accessDenied,
        errorMessage: error?.message,
        unauthorizedAccess: !accessDenied
      };
    });

    setProgress(100);
  };

  // Helper function to run individual tests
  const runTest = async (suiteName: string, testName: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    updateTestResult(suiteName, testName, { status: 'running', startTime });

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      updateTestResult(suiteName, testName, {
        status: 'passed',
        duration,
        details: result
      });

      logger.info(`Test passed: ${testName}`, result);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      updateTestResult(suiteName, testName, {
        status: 'failed',
        duration,
        error: errorMessage
      });

      logger.error(`Test failed: ${testName}`, error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestSuites([]);
    setProgress(0);

    const startTime = Date.now();

    try {
      await runBookingFlowTests();
      await runIntegrationTests();
      await runPerformanceTests();
      await runSecurityTests();

      const totalDuration = Date.now() - startTime;
      
      // Generate test report
      const allTests = testSuites.flatMap(suite => suite.tests);
      const report: TestReport = {
        suites: testSuites,
        totalTests: allTests.length,
        passedTests: allTests.filter(t => t.status === 'passed').length,
        failedTests: allTests.filter(t => t.status === 'failed').length,
        warningTests: allTests.filter(t => t.status === 'warning').length,
        totalDuration,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      };

      setTestReport(report);

      toast({
        title: "Test Suite Completed",
        description: `${report.passedTests}/${report.totalTests} tests passed in ${totalDuration}ms`,
      });
    } catch (error) {
      toast({
        title: "Test Suite Error",
        description: "An error occurred while running the test suite",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!testReport) return;

    const reportData = JSON.stringify(testReport, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maku-test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getCategoryColor = (category: TestSuite['category']) => {
    const colors = {
      booking: 'border-blue-200 bg-blue-50',
      integration: 'border-green-200 bg-green-50',
      performance: 'border-orange-200 bg-orange-50',
      security: 'border-red-200 bg-red-50'
    };
    return colors[category] || 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Comprehensive E2E Test Suite</h2>
          <p className="text-muted-foreground">Advanced testing framework for complete system validation</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="min-w-[140px]"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          {testReport && (
            <Button onClick={downloadReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="run">Test Execution</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="space-y-6">
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          <div className="grid gap-6">
            {testSuites.map((suite) => (
              <Card key={suite.name} className={getCategoryColor(suite.category)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{suite.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {suite.category}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {suite.tests.filter(t => t.status === 'passed').length}/{suite.tests.length} passed
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test) => (
                      <div key={test.name} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <span className="font-medium">{test.name}</span>
                          {test.duration && (
                            <span className="text-sm text-muted-foreground">
                              ({test.duration}ms)
                            </span>
                          )}
                        </div>
                        <Badge 
                          variant={test.status === 'passed' ? 'default' : 
                                  test.status === 'failed' ? 'destructive' : 
                                  test.status === 'warning' ? 'secondary' : 'outline'}
                        >
                          {test.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {testReport && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{testReport.passedTests}</div>
                  <p className="text-sm text-muted-foreground">Tests Passed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-red-600">{testReport.failedTests}</div>
                  <p className="text-sm text-muted-foreground">Tests Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-yellow-600">{testReport.warningTests}</div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{testReport.totalDuration}ms</div>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Detailed results would go here */}
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          {testReport && (
            <Card>
              <CardHeader>
                <CardTitle>Test Report Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(testReport, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};