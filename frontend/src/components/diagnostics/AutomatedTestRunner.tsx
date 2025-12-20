import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, PlayCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  response?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
}

export const AutomatedTestRunner = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0, duration: 0 });

  const testSuites: TestSuite[] = [
    {
      name: 'System Health',
      tests: [
        { name: 'Health Check', endpoint: '/api/health', status: 'pending' },
        { name: 'System Status', endpoint: '/api/status', status: 'pending' },
        { name: 'Real-time Health', endpoint: '/api/realtime/system/health', status: 'pending' }
      ]
    },
    {
      name: 'Analytics & Metrics',
      tests: [
        { name: 'Platform Overview', endpoint: '/api/analytics/overview', status: 'pending' },
        { name: 'Real-time Metrics', endpoint: '/api/analytics/realtime', status: 'pending' },
        { name: 'Booking Funnel', endpoint: '/api/analytics/booking-funnel', status: 'pending' },
        { name: 'User Segments', endpoint: '/api/analytics/users/segments', status: 'pending' }
      ]
    },
    {
      name: 'Provider System',
      tests: [
        { name: 'Provider Analytics', endpoint: '/api/admin/providers/analytics/overview', status: 'pending' },
        { name: 'Provider Health', endpoint: '/api/admin/providers/health/summary', status: 'pending' },
        { name: 'Provider Registry', endpoint: '/api/providers/registry', status: 'pending' },
        { name: 'Provider Rotation', endpoint: '/api/providers/active', status: 'pending' }
      ]
    },
    {
      name: 'Partner Dashboard',
      tests: [
        { name: 'Partner Stats', endpoint: '/api/partners/stats', status: 'pending' },
        { name: 'Dream Opportunities', endpoint: '/api/partners/opportunities', status: 'pending' },
        { name: 'Campaigns', endpoint: '/api/partners/campaigns', status: 'pending' },
        { name: 'Settlements', endpoint: '/api/partners/settlements', status: 'pending' }
      ]
    },
    {
      name: 'Payment Integration',
      tests: [
        { name: 'Payment Methods', endpoint: '/api/payments/methods/available?currency=usd', status: 'pending' },
        { name: 'Gateway Info', endpoint: '/api/payments/gateways/info', status: 'pending' }
      ]
    },
    {
      name: 'Search & Booking',
      tests: [
        { name: 'Unified Search', endpoint: '/api/unified-search?search_type=hotel&destination=Paris', status: 'pending' },
        { name: 'Hotel Search', endpoint: '/api/advanced-search/hotels?destination=Paris&check_in=2025-12-01&check_out=2025-12-05', status: 'pending' },
        { name: 'Bookings List', endpoint: '/api/bookings', status: 'pending' }
      ]
    }
  ];

  const runAllTests = async () => {
    setRunning(true);
    setProgress(0);
    const startTime = Date.now();
    
    const updatedSuites = JSON.parse(JSON.stringify(testSuites));
    setSuites(updatedSuites);
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    for (const suite of updatedSuites) {
      totalTests += suite.tests.length;
    }
    
    let completedTests = 0;
    
    for (const suite of updatedSuites) {
      for (const test of suite.tests) {
        test.status = 'running';
        setSuites([...updatedSuites]);
        
        const testStart = Date.now();
        
        try {
          const response = await axios.get(`${BACKEND_URL}${test.endpoint}`, {
            timeout: 10000,
            validateStatus: () => true // Accept any status
          });
          
          test.duration = Date.now() - testStart;
          
          if (response.status >= 200 && response.status < 400) {
            test.status = 'passed';
            test.response = response.data;
            passedTests++;
          } else {
            test.status = 'failed';
            test.error = `HTTP ${response.status}: ${response.statusText}`;
            failedTests++;
          }
        } catch (error: any) {
          test.duration = Date.now() - testStart;
          test.status = 'failed';
          test.error = error.message || 'Network error';
          failedTests++;
        }
        
        completedTests++;
        setProgress((completedTests / totalTests) * 100);
        setSuites([...updatedSuites]);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const totalDuration = Date.now() - startTime;
    setSummary({ total: totalTests, passed: passedTests, failed: failedTests, duration: totalDuration });
    setRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed': return <Badge className="bg-green-100 text-green-700">PASSED</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-700">FAILED</Badge>;
      case 'running': return <Badge className="bg-blue-100 text-blue-700">RUNNING</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🚀 1-Click Automated Testing</CardTitle>
          <CardDescription>
            Comprehensive automated testing of all backend APIs and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={runAllTests} 
              disabled={running}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {running ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            {summary.total > 0 && (
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">{summary.total}</div>
                  <div className="text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                  <div className="text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                  <div className="text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{(summary.duration / 1000).toFixed(1)}s</div>
                  <div className="text-gray-600">Duration</div>
                </div>
              </div>
            )}
          </div>
          
          {running && (
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}% complete</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {suites.length > 0 && (
        <div className="space-y-4">
          {suites.map((suite, suiteIdx) => (
            <Card key={suiteIdx}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{suite.name}</span>
                  <Badge variant="outline">
                    {suite.tests.filter(t => t.status === 'passed').length}/{suite.tests.length} Passed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suite.tests.map((test, testIdx) => (
                    <div 
                      key={testIdx} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="font-medium">{test.name}</div>
                          <div className="text-xs text-gray-500">{test.endpoint}</div>
                          {test.error && (
                            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {test.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {test.duration && (
                          <span className="text-xs text-gray-500">{test.duration}ms</span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
