import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube,
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  testId: string;
  testName: string;
  category: string;
  status: 'passed' | 'failed' | 'error' | 'running';
  executionTime: number;
  message: string;
  details?: any;
  timestamp: string;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  successRate: number;
  lastRun: Date | null;
}

const TEST_CATEGORIES = [
  { id: 'provider', name: 'Provider Integration', icon: '🔗' },
  { id: 'booking', name: 'Booking Flow', icon: '📋' },
  { id: 'database', name: 'Database Integrity', icon: '🗄️' },
  { id: 'performance', name: 'Performance', icon: '⚡' },
  { id: 'security', name: 'Security', icon: '🔒' }
];

export const TestInfrastructurePanel: React.FC = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoTest, setAutoTest] = useState(false);

  useEffect(() => {
    loadTestHistory();

    // Set up auto-testing if enabled
    if (autoTest) {
      const interval = setInterval(() => {
        runTestSuite();
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [autoTest]);

  const loadTestHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const results: TestResult[] = data?.map((result: any) => ({
        testId: result.test_id,
        testName: result.test_name,
        category: result.category,
        status: result.status,
        executionTime: result.execution_time_ms,
        message: result.message,
        details: result.details,
        timestamp: result.executed_at
      })) || [];

      setTestResults(results);
      calculateSummary(results);

    } catch (error) {
      console.error('Failed to load test history:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load test history.",
        variant: "destructive",
      });
    }
  };

  const calculateSummary = (results: TestResult[]) => {
    if (results.length === 0) {
      setSummary(null);
      return;
    }

    // Get latest test run results
    const latestTimestamp = results[0]?.timestamp;
    const latestResults = results.filter(r => r.timestamp === latestTimestamp);

    const totalTests = latestResults.length;
    const passedTests = latestResults.filter(r => r.status === 'passed').length;
    const failedTests = latestResults.filter(r => r.status === 'failed').length;
    const errorTests = latestResults.filter(r => r.status === 'error').length;

    setSummary({
      totalTests,
      passedTests,
      failedTests,
      errorTests,
      successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      lastRun: latestTimestamp ? new Date(latestTimestamp) : null
    });
  };

  const runTestSuite = async (category?: string) => {
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-infrastructure-activation', {
        body: {
          action: category ? 'run-category' : 'run-all',
          category: category
        }
      });

      if (error) throw error;

      toast({
        title: "Test Suite Completed",
        description: `${data.summary?.passedTests || 0}/${data.summary?.totalTests || 0} tests passed (${data.summary?.successRate || 0}% success rate)`,
        variant: data.summary?.successRate >= 80 ? "default" : "destructive",
      });

      // Reload test history
      await loadTestHistory();

    } catch (error) {
      console.error('Test suite failed:', error);
      toast({
        title: "Test Suite Failed",
        description: "Failed to execute test suite. Check system logs for details.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async (testId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('test-infrastructure-activation', {
        body: {
          action: 'run-single-test',
          testId: testId
        }
      });

      if (error) throw error;

      toast({
        title: "Test Completed",
        description: `Test ${testId}: ${data.result?.status || 'unknown'}`,
        variant: data.result?.status === 'passed' ? "default" : "destructive",
      });

      // Reload test history
      await loadTestHistory();

    } catch (error) {
      console.error('Single test failed:', error);
      toast({
        title: "Test Failed",
        description: `Failed to execute test ${testId}.`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'running': return <Clock className="h-4 w-4 text-muted-foreground animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'passed': return 'default';
      case 'failed': return 'destructive';
      case 'error': return 'secondary';
      case 'running': return 'outline';
      default: return 'outline';
    }
  };

  const getFilteredResults = () => {
    if (selectedCategory === 'all') return testResults;
    return testResults.filter(result => result.category === selectedCategory);
  };

  const getCategoryStats = (category: string) => {
    const categoryResults = testResults.filter(r => r.category === category);
    if (categoryResults.length === 0) return null;

    const latestTimestamp = categoryResults[0]?.timestamp;
    const latestResults = categoryResults.filter(r => r.timestamp === latestTimestamp);
    
    const total = latestResults.length;
    const passed = latestResults.filter(r => r.status === 'passed').length;
    
    return {
      total,
      passed,
      successRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="h-6 w-6" />
            Test Infrastructure
          </h2>
          <p className="text-muted-foreground">
            Automated testing and validation system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoTest(!autoTest)}
            className="gap-2"
          >
            {autoTest ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            Auto Test: {autoTest ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={() => runTestSuite()}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalTests}</div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{summary.passedTests}</div>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{summary.failedTests}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{summary.errorTests}</div>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.successRate >= 80 ? 'text-success' : 'text-destructive'}`}>
                  {summary.successRate}%
                </div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {TEST_CATEGORIES.map((category) => {
              const stats = getCategoryStats(category.id);
              return (
                <Card key={category.id} className="border">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl">{category.icon}</div>
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      {stats && (
                        <div>
                          <div className={`text-lg font-bold ${stats.successRate >= 80 ? 'text-success' : 'text-destructive'}`}>
                            {stats.successRate}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {stats.passed}/{stats.total} passed
                          </p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTestSuite(category.id)}
                        disabled={isRunning}
                        className="w-full"
                      >
                        Run Tests
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          {TEST_CATEGORIES.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory}>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory === 'all' ? 'All Test Results' : 
                 TEST_CATEGORIES.find(c => c.id === selectedCategory)?.name + ' Results'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getFilteredResults().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test results available. Run tests to see results here.
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredResults().slice(0, 20).map((result, index) => (
                    <div key={`${result.testId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium text-sm">{result.testName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {result.category} • {new Date(result.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(result.status)}>
                          {result.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {result.executionTime}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Health Status */}
      {summary && summary.successRate < 80 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Test success rate is below 80%. System may have critical issues that require attention.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};