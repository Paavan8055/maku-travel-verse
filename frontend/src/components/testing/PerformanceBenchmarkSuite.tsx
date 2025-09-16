import React, { useState, useEffect } from 'react';
import { Gauge, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceBenchmark {
  id: string;
  name: string;
  endpoint: string;
  targetResponseTime: number; // in ms
  actualResponseTime?: number;
  status: 'pending' | 'running' | 'passed' | 'failed';
  concurrentRequests?: number;
  successRate?: number;
}

interface ProviderCoverage {
  searchType: 'hotel' | 'flight' | 'activity';
  totalProviders: number;
  healthyProviders: number;
  coverage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export const PerformanceBenchmarkSuite: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([
    {
      id: 'hotel-search',
      name: 'Hotel Search',
      endpoint: 'provider-rotation',
      targetResponseTime: 3000,
      status: 'pending'
    },
    {
      id: 'flight-search',
      name: 'Flight Search',
      endpoint: 'provider-rotation',
      targetResponseTime: 3000,
      status: 'pending'
    },
    {
      id: 'activity-search',
      name: 'Activity Search',
      endpoint: 'provider-rotation',
      targetResponseTime: 3000,
      status: 'pending'
    },
    {
      id: 'hotel-booking',
      name: 'Hotel Booking Creation',
      endpoint: 'create-hotel-booking',
      targetResponseTime: 5000,
      status: 'pending'
    },
    {
      id: 'concurrent-load',
      name: 'Concurrent Load Test',
      endpoint: 'provider-rotation',
      targetResponseTime: 3000,
      status: 'pending',
      concurrentRequests: 10
    }
  ]);

  const [providerCoverage, setProviderCoverage] = useState<ProviderCoverage[]>([
    {
      searchType: 'hotel',
      totalProviders: 2,
      healthyProviders: 0,
      coverage: 0,
      status: 'critical'
    },
    {
      searchType: 'flight',
      totalProviders: 2,
      healthyProviders: 0,
      coverage: 0,
      status: 'critical'
    },
    {
      searchType: 'activity',
      totalProviders: 3,
      healthyProviders: 0,
      coverage: 0,
      status: 'critical'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const updateBenchmark = (id: string, updates: Partial<PerformanceBenchmark>) => {
    setBenchmarks(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  const runSingleBenchmark = async (benchmark: PerformanceBenchmark): Promise<void> => {
    updateBenchmark(benchmark.id, { status: 'running' });
    
    try {
      const startTime = performance.now();
      
      let testPayload;
      switch (benchmark.id) {
        case 'hotel-search':
          testPayload = {
            searchType: 'hotel',
            cityCode: 'SYD',
            checkInDate: '2025-09-01',
            checkOutDate: '2025-09-03',
            adults: 2,
            roomQuantity: 1
          };
          break;
        case 'flight-search':
          testPayload = {
            searchType: 'flight',
            originLocationCode: 'SYD',
            destinationLocationCode: 'MEL',
            departureDate: '2025-09-15',
            adults: 1
          };
          break;
        case 'activity-search':
          testPayload = {
            searchType: 'activity',
            cityCode: 'SYD',
            dateFrom: '2025-09-01',
            dateTo: '2025-09-03'
          };
          break;
        case 'hotel-booking':
          testPayload = {
            hotelId: 'TEST_HOTEL',
            checkInDate: '2025-09-01',
            checkOutDate: '2025-09-03',
            guests: 2,
            customerInfo: {
              email: 'perf-test@maku.travel',
              firstName: 'Performance',
              lastName: 'Test'
            },
            amount: 29900,
            currency: 'AUD'
          };
          break;
        case 'concurrent-load':
          // Run multiple concurrent requests
          const promises = Array(benchmark.concurrentRequests || 5).fill(null).map(() =>
            supabase.functions.invoke('provider-rotation', {
              body: {
                searchType: 'hotel',
                cityCode: 'SYD',
                checkInDate: '2025-09-01',
                checkOutDate: '2025-09-03',
                adults: 2,
                roomQuantity: 1
              }
            })
          );
          
          const results = await Promise.allSettled(promises);
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const successRate = (successCount / results.length) * 100;
          
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          updateBenchmark(benchmark.id, {
            status: responseTime <= benchmark.targetResponseTime ? 'passed' : 'failed',
            actualResponseTime: responseTime,
            successRate
          });
          return;
      }

      const { data, error } = await supabase.functions.invoke(benchmark.endpoint, {
        body: testPayload
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      if (error) {
        updateBenchmark(benchmark.id, {
          status: 'failed',
          actualResponseTime: responseTime
        });
        return;
      }

      updateBenchmark(benchmark.id, {
        status: responseTime <= benchmark.targetResponseTime ? 'passed' : 'failed',
        actualResponseTime: responseTime
      });

    } catch (error) {
      updateBenchmark(benchmark.id, {
        status: 'failed',
        actualResponseTime: benchmark.targetResponseTime + 1000 // Mark as failed
      });
    }
  };

  const checkProviderCoverage = async (): Promise<void> => {
    try {
      // Check provider health for each search type
      const searchTypes = ['hotel', 'flight', 'activity'];
      
      for (const searchType of searchTypes) {
        const { data } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType,
            checkHealthOnly: true
          }
        });

        if (data?.providerHealth) {
          const healthy = data.providerHealth.filter((p: any) => p.status === 'healthy').length;
          const total = data.providerHealth.length;
          const coverage = (healthy / total) * 100;
          
          let status: ProviderCoverage['status'] = 'critical';
          if (coverage >= 98) status = 'excellent';
          else if (coverage >= 90) status = 'good';
          else if (coverage >= 70) status = 'warning';

          setProviderCoverage(prev => prev.map(p => 
            p.searchType === searchType 
              ? { ...p, healthyProviders: healthy, totalProviders: total, coverage, status }
              : p
          ));
        }
      }
    } catch (error) {
      console.error('Provider coverage check failed:', error);
    }
  };

  const runAllBenchmarks = async (): Promise<void> => {
    setIsRunning(true);
    
    // First check provider coverage
    await checkProviderCoverage();
    
    // Then run performance benchmarks
    for (const benchmark of benchmarks) {
      await runSingleBenchmark(benchmark);
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Calculate overall score
    const passedBenchmarks = benchmarks.filter(b => b.status === 'passed').length;
    const avgCoverage = providerCoverage.reduce((acc, p) => acc + p.coverage, 0) / providerCoverage.length;
    const score = (passedBenchmarks / benchmarks.length) * 70 + (avgCoverage * 0.3);
    
    setOverallScore(Math.round(score));
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Gauge className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCoverageColor = (status: ProviderCoverage['status']) => {
    switch (status) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Performance Benchmark Suite
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {overallScore}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
            
            <Button 
              onClick={runAllBenchmarks}
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? 'Running Tests...' : 'Run Benchmarks'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Benchmarks (&lt;3s target)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {benchmarks.map((benchmark) => (
              <div
                key={benchmark.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(benchmark.status)}
                  <div>
                    <h4 className="font-medium">{benchmark.name}</h4>
                    {benchmark.actualResponseTime && (
                      <p className="text-sm text-muted-foreground">
                        {benchmark.actualResponseTime.toFixed(0)}ms
                        {benchmark.concurrentRequests && (
                          <span> ({benchmark.concurrentRequests} concurrent)</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {benchmark.actualResponseTime && (
                    <Progress 
                      value={(benchmark.actualResponseTime / benchmark.targetResponseTime) * 100} 
                      className="w-20"
                    />
                  )}
                  {benchmark.successRate && (
                    <Badge variant="outline">
                      {benchmark.successRate.toFixed(0)}% success
                    </Badge>
                  )}
                  <Badge 
                    variant={benchmark.status === 'passed' ? 'default' : 
                            benchmark.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {benchmark.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Coverage (98% target)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providerCoverage.map((coverage) => (
              <div
                key={coverage.searchType}
                className="p-4 border border-border rounded-lg text-center"
              >
                <h4 className="font-medium capitalize mb-2">
                  {coverage.searchType}
                </h4>
                <div className={`text-2xl font-bold ${getCoverageColor(coverage.status)}`}>
                  {coverage.coverage.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {coverage.healthyProviders}/{coverage.totalProviders} healthy
                </p>
                <Badge 
                  variant={coverage.status === 'excellent' ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {coverage.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};