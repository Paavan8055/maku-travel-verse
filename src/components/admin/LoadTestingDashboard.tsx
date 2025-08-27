import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Users, Zap, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface LoadTestConfig {
  name: string;
  description: string;
  userCount: number;
  duration: number;
  endpoints: string[];
}

interface LoadTestResult {
  testName: string;
  startTime: string;
  endTime: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  status: 'running' | 'completed' | 'failed';
}

export const LoadTestingDashboard = () => {
  const [currentTest, setCurrentTest] = useState<LoadTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<LoadTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const loadTestConfigs: LoadTestConfig[] = [
    {
      name: 'Light Load Test',
      description: 'Simulate 25 concurrent users for basic functionality',
      userCount: 25,
      duration: 300, // 5 minutes
      endpoints: ['/api/search', '/api/bookings', '/api/payments']
    },
    {
      name: 'Standard Load Test',
      description: 'Simulate 100 concurrent users for normal traffic',
      userCount: 100,
      duration: 600, // 10 minutes
      endpoints: ['/api/search', '/api/bookings', '/api/payments', '/api/auth']
    },
    {
      name: 'Stress Test',
      description: 'Simulate 250 concurrent users for peak traffic',
      userCount: 250,
      duration: 900, // 15 minutes
      endpoints: ['/api/search', '/api/bookings', '/api/payments', '/api/auth', '/api/providers']
    },
    {
      name: 'Spike Test',
      description: 'Rapid user increase to test auto-scaling',
      userCount: 500,
      duration: 300, // 5 minutes
      endpoints: ['/api/search', '/api/bookings', '/api/payments']
    }
  ];

  const runLoadTest = async (config: LoadTestConfig) => {
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('load-testing', {
        body: {
          testConfig: config,
          action: 'start'
        }
      });

      if (error) throw error;

      const newTest: LoadTestResult = {
        testName: config.name,
        startTime: new Date().toISOString(),
        endTime: '',
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        status: 'running'
      };

      setCurrentTest(newTest);

      toast({
        title: "Load Test Started",
        description: `${config.name} is now running with ${config.userCount} virtual users`,
        variant: "default"
      });

      // Simulate test progress updates
      const interval = setInterval(async () => {
        // In a real implementation, this would fetch actual test progress
        setCurrentTest(prev => {
          if (!prev) return null;
          
          const elapsed = (Date.now() - new Date(prev.startTime).getTime()) / 1000;
          const progress = Math.min(elapsed / config.duration, 1);
          
          if (elapsed >= config.duration) {
            setTimeout(() => completeTest(), 100);
          }
          
          return {
            ...prev,
            totalRequests: Math.floor(progress * config.userCount * 10),
            successfulRequests: Math.floor(progress * config.userCount * 9.2),
            failedRequests: Math.floor(progress * config.userCount * 0.8),
            averageResponseTime: Math.floor(200 + Math.random() * 300),
            maxResponseTime: Math.floor(500 + Math.random() * 1000),
            requestsPerSecond: Math.floor(config.userCount * 0.5 + Math.random() * 20),
            errorRate: Math.round((Math.random() * 5) * 100) / 100
          };
        });
      }, 2000);

    } catch (error) {
      console.error('Error starting load test:', error);
      toast({
        title: "Load Test Failed",
        description: "Failed to start load test",
        variant: "destructive"
      });
      setIsRunning(false);
    }
  };

  const completeTest = () => {
    if (!currentTest) return;

    const completedTest: LoadTestResult = {
      ...currentTest,
      endTime: new Date().toISOString(),
      status: 'completed'
    };

    setTestHistory(prev => [completedTest, ...prev.slice(0, 9)]);
    setCurrentTest(null);
    setIsRunning(false);

    toast({
      title: "Load Test Completed",
      description: `Test finished with ${completedTest.errorRate}% error rate`,
      variant: completedTest.errorRate < 5 ? "default" : "destructive"
    });
  };

  const stopCurrentTest = async () => {
    if (!currentTest) return;

    try {
      await supabase.functions.invoke('load-testing', {
        body: { action: 'stop' }
      });

      setCurrentTest(prev => prev ? { ...prev, status: 'failed', endTime: new Date().toISOString() } : null);
      setIsRunning(false);

      toast({
        title: "Load Test Stopped",
        description: "Test was manually stopped",
        variant: "default"
      });
    } catch (error) {
      console.error('Error stopping test:', error);
    }
  };

  const getTestProgress = () => {
    if (!currentTest) return 0;
    
    const elapsed = (Date.now() - new Date(currentTest.startTime).getTime()) / 1000;
    const duration = loadTestConfigs.find(c => c.name === currentTest.testName)?.duration || 300;
    return Math.min((elapsed / duration) * 100, 100);
  };

  const getStatusBadge = (status: string, errorRate?: number) => {
    if (status === 'running') return <Badge variant="secondary">Running</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
    if (errorRate && errorRate > 5) return <Badge variant="destructive">High Error Rate</Badge>;
    return <Badge variant="default">Passed</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Load Testing Dashboard
          </CardTitle>
          <CardDescription>
            Simulate concurrent users to test system performance and scalability
          </CardDescription>
        </CardHeader>
      </Card>

      {currentTest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{currentTest.testName} - Running</CardTitle>
                <CardDescription>
                  Started at {new Date(currentTest.startTime).toLocaleTimeString()}
                </CardDescription>
              </div>
              <Button onClick={stopCurrentTest} variant="destructive" size="sm">
                Stop Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round(getTestProgress())}%</span>
                </div>
                <Progress value={getTestProgress()} className="h-2" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentTest.totalRequests}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentTest.averageResponseTime}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{currentTest.requestsPerSecond}</div>
                  <div className="text-sm text-muted-foreground">Requests/sec</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{currentTest.errorRate}%</div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                </div>
              </div>

              {currentTest.errorRate > 5 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High error rate detected ({currentTest.errorRate}%). System may be under stress.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Load Tests</CardTitle>
            <CardDescription>Choose a test configuration to simulate user load</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {loadTestConfigs.map((config) => (
                <div
                  key={config.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">{config.name}</h3>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{config.userCount} users</span>
                        <span>{Math.floor(config.duration / 60)} minutes</span>
                        <span>{config.endpoints.length} endpoints</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => runLoadTest(config)}
                    disabled={isRunning}
                    variant="outline"
                    size="sm"
                  >
                    {isRunning ? 'Running...' : 'Start Test'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {testHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test History</CardTitle>
              <CardDescription>Recent load test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testHistory.map((test, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{test.testName}</span>
                        {getStatusBadge(test.status, test.errorRate)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(test.startTime).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm">
                        <span>{test.totalRequests} requests</span>
                        <span>{test.averageResponseTime}ms avg</span>
                        <span className={test.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
                          {test.errorRate}% errors
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};