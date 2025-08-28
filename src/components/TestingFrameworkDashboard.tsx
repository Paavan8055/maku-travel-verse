import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  Activity, 
  Zap, 
  Shield,
  RefreshCw,
  Play
} from 'lucide-react';

interface TestResult {
  test_name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  total_duration: number;
  pass_rate: number;
}

export const TestingFrameworkDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<TestSuite | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const { toast } = useToast();

  const runTests = async (testType: string) => {
    try {
      setLoading(true);
      setSelectedTestType(testType);
      
      const { data, error } = await supabase.functions.invoke('comprehensive-testing-framework', {
        body: { action: 'run_tests', test_type: testType }
      });

      if (error) {
        console.error('Test execution failed:', error);
        toast({
          title: "Test Execution Failed",
          description: "Unable to run the test suite",
          variant: "destructive"
        });
      } else {
        setTestResults(data);
        toast({
          title: "Tests Completed",
          description: `${testType.toUpperCase()} tests finished with ${data.pass_rate.toFixed(1)}% pass rate`,
          variant: data.pass_rate >= 80 ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Testing error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during testing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateBookingFlow = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('comprehensive-testing-framework', {
        body: { action: 'validate_booking_flow' }
      });

      if (error) {
        console.error('Booking validation failed:', error);
        toast({
          title: "Validation Failed",
          description: "Booking flow validation encountered errors",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Booking Flow Validated",
          description: "All booking flow steps verified successfully",
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProviderIntegrations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('comprehensive-testing-framework', {
        body: { action: 'test_provider_integrations' }
      });

      if (error) {
        console.error('Provider testing failed:', error);
        toast({
          title: "Provider Tests Failed",
          description: "Some provider integrations are not responding correctly",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Provider Tests Complete",
          description: "All provider integrations tested successfully",
        });
      }
    } catch (error) {
      console.error('Provider testing error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runStressTest = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('comprehensive-testing-framework', {
        body: { action: 'stress_test' }
      });

      if (error) {
        console.error('Stress test failed:', error);
        toast({
          title: "Stress Test Failed",
          description: "System performance issues detected under load",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Stress Test Complete",
          description: `System handled ${data.concurrent_users} concurrent users successfully`,
        });
      }
    } catch (error) {
      console.error('Stress testing error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'skipped':
        return 'text-yellow-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Comprehensive Testing Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => runTests('api')} 
              disabled={loading}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Activity className="h-6 w-6" />
              API Tests
            </Button>
            
            <Button 
              onClick={() => runTests('booking')} 
              disabled={loading}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <CheckCircle className="h-6 w-6" />
              Booking Tests
            </Button>
            
            <Button 
              onClick={() => runTests('integration')} 
              disabled={loading}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Shield className="h-6 w-6" />
              Integration Tests
            </Button>
            
            <Button 
              onClick={() => runTests('performance')} 
              disabled={loading}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Zap className="h-6 w-6" />
              Performance Tests
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={validateBookingFlow} 
              disabled={loading}
              variant="secondary"
            >
              <Play className="h-4 w-4 mr-2" />
              Validate Booking Flow
            </Button>
            
            <Button 
              onClick={testProviderIntegrations} 
              disabled={loading}
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Providers
            </Button>
            
            <Button 
              onClick={runStressTest} 
              disabled={loading}
              variant="secondary"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stress Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Running {selectedTestType.toUpperCase()} Tests...</p>
              <p className="text-muted-foreground">This may take a few moments</p>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{testResults.name}</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant={testResults.pass_rate >= 80 ? "default" : "destructive"}>
                  {testResults.pass_rate.toFixed(1)}% Pass Rate
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {testResults.total_duration}ms total
                </span>
              </div>
            </div>
            <Progress value={testResults.pass_rate} className="w-full" />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="results" className="w-full">
              <TabsList>
                <TabsTrigger value="results">Test Results</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-4">
                <div className="space-y-3">
                  {testResults.tests.map((test, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <p className="font-medium">{test.test_name}</p>
                          {test.error && (
                            <p className="text-sm text-red-600">{test.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(test.status)}
                        >
                          {test.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {test.duration_ms}ms
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold text-green-600">
                        {testResults.tests.filter(t => t.status === 'passed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Passed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                      <p className="text-2xl font-bold text-red-600">
                        {testResults.tests.filter(t => t.status === 'failed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">
                        {testResults.tests.filter(t => t.status === 'skipped').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Skipped</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Duration:</span>
                        <span className="ml-2 font-medium">{testResults.total_duration}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Average Test Time:</span>
                        <span className="ml-2 font-medium">
                          {Math.round(testResults.total_duration / testResults.tests.length)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success Rate:</span>
                        <span className="ml-2 font-medium">{testResults.pass_rate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Tests:</span>
                        <span className="ml-2 font-medium">{testResults.tests.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};