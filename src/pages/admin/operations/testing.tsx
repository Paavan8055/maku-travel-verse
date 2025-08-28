
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestTube, Play, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminTestSuite() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  
  const tests = [
    {
      name: 'API Connectivity Tests',
      status: 'passed',
      lastRun: '2 hours ago',
      duration: '45s'
    },
    {
      name: 'Payment Processing Tests',
      status: 'passed',
      lastRun: '1 hour ago',
      duration: '120s'
    },
    {
      name: 'Booking Flow Tests',
      status: 'failed',
      lastRun: '30 minutes ago',
      duration: '180s'
    },
    {
      name: 'Provider Integration Tests',
      status: 'running',
      lastRun: 'Now',
      duration: '60s'
    }
  ];

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
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      toast({
        title: "Running All Tests",
        description: "Starting comprehensive test suite...",
      });

      // Run health check
      const healthCheck = await supabase.functions.invoke('health-check');
      
      // Run provider tests
      const providerTests = await supabase.functions.invoke('test-provider-rotation');
      
      toast({
        title: "Tests Completed",
        description: "All tests have finished running. Check results below.",
      });
    } catch (error) {
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
    try {
      toast({
        title: "Running Provider Tests",
        description: "Testing provider integrations...",
      });

      const result = await supabase.functions.invoke('test-provider-rotation');
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Provider Tests Completed",
        description: `Tests completed successfully. ${result.data?.summary?.successful || 0} passed, ${result.data?.summary?.failed || 0} failed.`,
      });
    } catch (error) {
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
