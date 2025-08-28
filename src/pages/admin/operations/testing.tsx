
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestTube, Play, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminTestSuite() {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState([
    {
      name: 'Health Check Tests',
      status: 'idle',
      lastRun: 'Never',
      duration: '--'
    },
    {
      name: 'Hotel Provider Tests',
      status: 'idle',
      lastRun: 'Never',
      duration: '--'
    },
    {
      name: 'Flight Provider Tests',
      status: 'idle',
      lastRun: 'Never',
      duration: '--'
    },
    {
      name: 'Activity Provider Tests',
      status: 'idle',
      lastRun: 'Never',
      duration: '--'
    }
  ]);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />;
      default:
        return <TestTube className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'idle':
        return <Badge variant="outline">Idle</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const updateTestStatus = (testName: string, status: string, duration?: string) => {
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { 
            ...test, 
            status, 
            lastRun: new Date().toLocaleTimeString(),
            duration: duration || test.duration 
          }
        : test
    ));
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    
    try {
      toast({
        title: "Running All Tests",
        description: "Starting comprehensive test suite...",
      });

      // Update all tests to running
      updateTestStatus('Health Check Tests', 'running');
      updateTestStatus('Hotel Provider Tests', 'running');
      updateTestStatus('Flight Provider Tests', 'running');
      updateTestStatus('Activity Provider Tests', 'running');

      // Run health check
      const healthStart = Date.now();
      const healthCheck = await supabase.functions.invoke('health-check');
      const healthDuration = `${Math.round((Date.now() - healthStart) / 1000)}s`;
      updateTestStatus('Health Check Tests', healthCheck.error ? 'failed' : 'passed', healthDuration);
      
      // Run provider tests
      const providerStart = Date.now();
      const providerTests = await supabase.functions.invoke('test-provider-rotation');
      
      if (providerTests.data?.testResults) {
        // Update individual provider test results
        providerTests.data.testResults.forEach((result: any) => {
          const testName = `${result.service.charAt(0).toUpperCase() + result.service.slice(1)} Provider Tests`;
          const duration = `${Math.round((Date.now() - providerStart) / 1000)}s`;
          updateTestStatus(testName, result.success ? 'passed' : 'failed', duration);
        });
      } else {
        // If no detailed results, mark all as failed
        const duration = `${Math.round((Date.now() - providerStart) / 1000)}s`;
        updateTestStatus('Hotel Provider Tests', 'failed', duration);
        updateTestStatus('Flight Provider Tests', 'failed', duration);
        updateTestStatus('Activity Provider Tests', 'failed', duration);
      }
      
      const totalDuration = Math.round((Date.now() - startTime) / 1000);
      toast({
        title: "Tests Completed",
        description: `All tests finished in ${totalDuration}s. Check results below.`,
      });
    } catch (error) {
      // Mark all running tests as failed
      setTests(prev => prev.map(test => 
        test.status === 'running' 
          ? { ...test, status: 'failed', lastRun: new Date().toLocaleTimeString() }
          : test
      ));
      
      toast({
        title: "Test Failed",
        description: "An error occurred while running tests.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runProviderTests = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    
    try {
      toast({
        title: "Running Provider Tests",
        description: "Testing provider integrations...",
      });

      // Update provider tests to running
      updateTestStatus('Hotel Provider Tests', 'running');
      updateTestStatus('Flight Provider Tests', 'running');
      updateTestStatus('Activity Provider Tests', 'running');

      const result = await supabase.functions.invoke('test-provider-rotation');
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data?.testResults) {
        // Update individual provider test results
        result.data.testResults.forEach((testResult: any) => {
          const testName = `${testResult.service.charAt(0).toUpperCase() + testResult.service.slice(1)} Provider Tests`;
          const duration = `${Math.round((Date.now() - startTime) / 1000)}s`;
          updateTestStatus(testName, testResult.success ? 'passed' : 'failed', duration);
        });
      } else {
        // If no detailed results, mark all as failed
        const duration = `${Math.round((Date.now() - startTime) / 1000)}s`;
        updateTestStatus('Hotel Provider Tests', 'failed', duration);
        updateTestStatus('Flight Provider Tests', 'failed', duration);
        updateTestStatus('Activity Provider Tests', 'failed', duration);
      }

      const totalDuration = Math.round((Date.now() - startTime) / 1000);
      toast({
        title: "Provider Tests Completed",
        description: `Tests completed in ${totalDuration}s. ${result.data?.summary?.successful || 0} passed, ${result.data?.summary?.failed || 0} failed.`,
      });
    } catch (error) {
      // Mark all running tests as failed
      setTests(prev => prev.map(test => 
        test.status === 'running' 
          ? { ...test, status: 'failed', lastRun: new Date().toLocaleTimeString() }
          : test
      ));
      
      toast({
        title: "Provider Tests Failed",
        description: "An error occurred while testing providers.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Suite</h1>
        <p className="text-muted-foreground">
          Run and monitor automated tests for system reliability
        </p>
      </div>

      <div className="flex gap-4">
        <Button 
          className="gap-2" 
          onClick={runAllTests}
          disabled={isRunning}
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Running...' : 'Run All Tests'}
        </Button>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={runProviderTests}
          disabled={isRunning}
        >
          <TestTube className="h-4 w-4" />
          {isRunning ? 'Testing...' : 'Run Provider Tests'}
        </Button>
      </div>

      <div className="grid gap-4">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(test.status)}
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                {getStatusBadge(test.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Last run: {test.lastRun}</span>
                <span>Duration: {test.duration}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
