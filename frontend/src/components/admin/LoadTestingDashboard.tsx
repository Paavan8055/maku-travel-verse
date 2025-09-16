import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Users, 
  Zap, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export const LoadTestingDashboard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState('api_comprehensive');
  const [concurrentUsers, setConcurrentUsers] = useState('25');
  const [duration, setDuration] = useState('5');
  const { toast } = useToast();

  const runLoadTest = async () => {
    setIsRunning(true);
    try {
      // Simulate load test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Load Test Started",
        description: `Testing ${concurrentUsers} concurrent users for ${duration} minutes`,
      });
    } catch (error) {
      console.error('Load test error:', error);
      toast({
        title: "Load Test Failed",
        description: "Failed to start load test",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Mock test results for display
  const mockResults = [
    {
      id: '1',
      test_name: 'API Comprehensive Test',
      concurrent_users: 25,
      duration_minutes: 5,
      status: 'completed' as const,
      success_rate: 99.2,
      avg_response_time: 85,
      requests_per_second: 150,
      peak_response_time: 340,
      error_rate: 0.8,
      started_at: new Date().toISOString()
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPerformanceGrade = (avgResponseTime: number, successRate: number) => {
    if (successRate >= 99 && avgResponseTime < 100) return 'A+';
    if (successRate >= 95 && avgResponseTime < 250) return 'A';
    if (successRate >= 90 && avgResponseTime < 500) return 'B';
    if (successRate >= 80 && avgResponseTime < 1000) return 'C';
    return 'F';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Load Test Configuration
            </CardTitle>
            <CardDescription>
              Configure and execute load tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_comprehensive">API Comprehensive</SelectItem>
                  <SelectItem value="booking_flow">Booking Flow</SelectItem>
                  <SelectItem value="agent_system">Agent System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Concurrent Users</label>
              <Select value={concurrentUsers} onValueChange={setConcurrentUsers}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Users</SelectItem>
                  <SelectItem value="25">25 Users</SelectItem>
                  <SelectItem value="50">50 Users</SelectItem>
                  <SelectItem value="100">100 Users</SelectItem>
                  <SelectItem value="250">250 Users</SelectItem>
                  <SelectItem value="500">500 Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={runLoadTest} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <Activity className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Running Test...' : 'Start Load Test'}
            </Button>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Real-time load testing performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">25</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">85ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted">
                <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">150</div>
                <div className="text-sm text-muted-foreground">Req/sec</div>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted">
                <Target className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">99.2%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Response Time Distribution</span>
                  <span>85ms avg</span>
                </div>
                <Progress value={15} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Success Rate</span>
                  <span>99.2%</span>
                </div>
                <Progress value={99.2} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results History */}
      <Card>
        <CardHeader>
          <CardTitle>Load Test Results</CardTitle>
          <CardDescription>
            Historical performance test results and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockResults.map((result) => (
              <div key={result.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h4 className="font-medium">{result.test_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.concurrent_users} users • {result.duration_minutes}min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    <Badge variant="outline">
                      Grade: {getPerformanceGrade(result.avg_response_time, result.success_rate)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Success Rate:</span>
                    <div className="font-medium">{result.success_rate}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Response:</span>
                    <div className="font-medium">{result.avg_response_time}ms</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Peak Response:</span>
                    <div className="font-medium">{result.peak_response_time}ms</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Throughput:</span>
                    <div className="font-medium">{result.requests_per_second} req/s</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Error Rate:</span>
                    <div className="font-medium">{result.error_rate}%</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Started: {new Date(result.started_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};