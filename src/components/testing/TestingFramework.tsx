import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useErrorReporting } from '@/hooks/useErrorReporting';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'functionality' | 'accessibility' | 'performance' | 'visual';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  status: 'idle' | 'running' | 'completed';
}

// Mock test suites for demo
const mockTestSuites: TestSuite[] = [
  {
    id: 'booking-flow',
    name: 'Booking Flow Tests',
    description: 'End-to-end booking functionality tests',
    status: 'idle',
    tests: [
      {
        id: 'search-hotels',
        name: 'Hotel Search',
        description: 'Test hotel search functionality',
        category: 'functionality',
        status: 'pending'
      },
      {
        id: 'select-room',
        name: 'Room Selection',
        description: 'Test room selection process',
        category: 'functionality',
        status: 'pending'
      },
      {
        id: 'payment-flow',
        name: 'Payment Processing',
        description: 'Test payment form and processing',
        category: 'functionality',
        status: 'pending'
      }
    ]
  },
  {
    id: 'accessibility',
    name: 'Accessibility Tests',
    description: 'WCAG compliance and accessibility tests',
    status: 'idle',
    tests: [
      {
        id: 'keyboard-nav',
        name: 'Keyboard Navigation',
        description: 'Test keyboard navigation throughout the app',
        category: 'accessibility',
        status: 'pending'
      },
      {
        id: 'screen-reader',
        name: 'Screen Reader Support',
        description: 'Test screen reader compatibility',
        category: 'accessibility',
        status: 'pending'
      },
      {
        id: 'color-contrast',
        name: 'Color Contrast',
        description: 'Test color contrast ratios',
        category: 'accessibility',
        status: 'pending'
      }
    ]
  }
];

const TestingFramework: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>(mockTestSuites);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const { reportError } = useErrorReporting();

  // Simulate test execution
  const executeTest = async (suiteId: string, testId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random test results
        const success = Math.random() > 0.2; // 80% success rate
        const duration = Math.floor(Math.random() * 3000) + 500; // 500-3500ms
        
        setTestSuites(prev => prev.map(suite => {
          if (suite.id === suiteId) {
            return {
              ...suite,
              tests: suite.tests.map(test => {
                if (test.id === testId) {
                  return {
                    ...test,
                    status: success ? 'passed' : 'failed',
                    duration,
                    error: success ? undefined : 'Test assertion failed: Expected element to be visible'
                  };
                }
                return test;
              })
            };
          }
          return suite;
        }));

        if (success) {
          resolve();
        } else {
          reject(new Error('Test failed'));
        }
      }, Math.floor(Math.random() * 3000) + 500);
    });
  };

  const runTest = async (suiteId: string, testId: string) => {
    const key = `${suiteId}-${testId}`;
    setRunningTests(prev => new Set(prev).add(key));
    
    // Mark test as running
    setTestSuites(prev => prev.map(suite => {
      if (suite.id === suiteId) {
        return {
          ...suite,
          tests: suite.tests.map(test => {
            if (test.id === testId) {
              return { ...test, status: 'running' };
            }
            return test;
          })
        };
      }
      return suite;
    }));

    try {
      await executeTest(suiteId, testId);
    } catch (error) {
      reportError(error as Error, {
        section: 'testing',
        testSuite: suiteId,
        testCase: testId
      });
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const runTestSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { ...s, status: 'running' } : s
    ));

    // Run all tests in sequence
    for (const test of suite.tests) {
      await runTest(suiteId, test.id);
    }

    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { ...s, status: 'completed' } : s
    ));
  };

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getCategoryColor = (category: TestCase['category']) => {
    switch (category) {
      case 'functionality':
        return 'bg-blue-500';
      case 'accessibility':
        return 'bg-purple-500';
      case 'performance':
        return 'bg-orange-500';
      case 'visual':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getOverallStats = () => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    const passed = allTests.filter(test => test.status === 'passed').length;
    const failed = allTests.filter(test => test.status === 'failed').length;
    const running = allTests.filter(test => test.status === 'running').length;
    const total = allTests.length;

    return { passed, failed, running, total };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Test Results</h2>
            </div>
            <Button
              onClick={() => testSuites.forEach(suite => runTestSuite(suite.id))}
              disabled={stats.running > 0}
              className="flex items-center gap-2"
            >
              {stats.running > 0 ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {stats.running > 0 ? 'Running...' : 'Run All Tests'}
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              <div className="text-sm text-muted-foreground">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          {stats.total > 0 && (
            <Progress 
              value={(stats.passed + stats.failed) / stats.total * 100} 
              className="h-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Test Suites */}
      <div className="space-y-4">
        {testSuites.map(suite => (
          <Card key={suite.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {suite.name}
                    <Badge variant={suite.status === 'completed' ? 'default' : 'secondary'}>
                      {suite.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suite.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTestSuite(suite.id)}
                  disabled={suite.status === 'running'}
                >
                  {suite.status === 'running' ? 'Running...' : 'Run Suite'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suite.tests.map(test => (
                  <div 
                    key={test.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {test.description}
                        </div>
                        {test.error && (
                          <div className="text-sm text-red-600 mt-1">
                            {test.error}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getCategoryColor(test.category)} text-white border-transparent`}
                      >
                        {test.category}
                      </Badge>
                      {test.duration && (
                        <Badge variant="outline">
                          {test.duration}ms
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runTest(suite.id, test.id)}
                        disabled={test.status === 'running'}
                      >
                        Run
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export { TestingFramework };
export default TestingFramework;