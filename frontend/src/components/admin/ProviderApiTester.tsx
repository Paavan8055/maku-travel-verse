import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plane, Building, MapPin, CreditCard, Wifi, WifiOff, Clock, CheckCircle, XCircle } from "lucide-react";

interface ProviderTest {
  name: string;
  icon: React.ReactNode;
  endpoint: string;
  description: string;
  testData: any;
}

interface TestResult {
  provider: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  message: string;
  data?: any;
}

export const ProviderApiTester = () => {
  const [testing, setTesting] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const { toast } = useToast();

  const providers: ProviderTest[] = [
    {
      name: 'Amadeus Flights',
      icon: <Plane className="h-4 w-4" />,
      endpoint: 'amadeus-flight-search',
      description: 'Test flight search and availability',
      testData: {
        origin: 'SYD',
        destination: 'MEL',
        departureDate: '2025-09-01',
        adults: 1
      }
    },
    {
      name: 'HotelBeds Hotels',
      icon: <Building className="h-4 w-4" />,
      endpoint: 'hotelbeds-hotel-search',
      description: 'Test hotel availability and pricing',
      testData: {
        cityCode: 'SYD',
        checkIn: '2025-09-01',
        checkOut: '2025-09-03',
        adults: 2
      }
    },
    {
      name: 'HotelBeds Activities',
      icon: <MapPin className="h-4 w-4" />,
      endpoint: 'hotelbeds-activity-search',
      description: 'Test activity and tour availability',
      testData: {
        cityCode: 'SYD',
        dateFrom: '2025-09-01',
        dateTo: '2025-09-07'
      }
    },
    {
      name: 'Sabre Availability',
      icon: <Plane className="h-4 w-4" />,
      endpoint: 'sabre-availability',
      description: 'Test Sabre GDS connectivity',
      testData: {
        origin: 'SYD',
        destination: 'LAX',
        departureDate: '2025-09-01'
      }
    },
    {
      name: 'Stripe Payments',
      icon: <CreditCard className="h-4 w-4" />,
      endpoint: 'stripe-test-payment',
      description: 'Test payment processing capability',
      testData: {
        amount: 100,
        currency: 'aud',
        testMode: true
      }
    }
  ];

  const testProvider = async (provider: ProviderTest) => {
    const providerId = provider.name;
    setTesting(prev => new Set(prev).add(providerId));
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('provider-api-tester', {
        body: {
          provider: provider.endpoint,
          testData: provider.testData
        }
      });

      const responseTime = Date.now() - startTime;

      if (error) throw error;

      const result: TestResult = {
        provider: providerId,
        status: data.success ? 'success' : 'error',
        responseTime,
        message: data.message || 'Test completed',
        data: data.data
      };

      setResults(prev => ({ ...prev, [providerId]: result }));

      toast({
        title: `${providerId} Test ${result.status === 'success' ? 'Passed' : 'Failed'}`,
        description: `Response time: ${responseTime}ms`,
        variant: result.status === 'success' ? "default" : "destructive"
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        provider: providerId,
        status: 'error',
        responseTime,
        message: error instanceof Error ? error.message : 'Unknown error'
      };

      setResults(prev => ({ ...prev, [providerId]: result }));

      toast({
        title: `${providerId} Test Failed`,
        description: result.message,
        variant: "destructive"
      });
    } finally {
      setTesting(prev => {
        const next = new Set(prev);
        next.delete(providerId);
        return next;
      });
    }
  };

  const testAllProviders = async () => {
    for (const provider of providers) {
      await testProvider(provider);
      // Small delay between tests to avoid overwhelming APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusIcon = (status?: 'success' | 'error' | 'timeout') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: 'success' | 'error' | 'timeout') => {
    switch (status) {
      case 'success': return <Badge variant="default">Connected</Badge>;
      case 'error': return <Badge variant="destructive">Failed</Badge>;
      case 'timeout': return <Badge variant="secondary">Timeout</Badge>;
      default: return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  const successfulTests = Object.values(results).filter(r => r.status === 'success').length;
  const failedTests = Object.values(results).filter(r => r.status === 'error').length;
  const averageResponseTime = Object.values(results).length > 0 
    ? Math.round(Object.values(results).reduce((sum, r) => sum + r.responseTime, 0) / Object.values(results).length)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Provider API Connectivity Tests
          </CardTitle>
          <CardDescription>
            Test all external provider APIs for connectivity and response times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{successfulTests}</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{averageResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
            </div>
            
            <Button 
              onClick={testAllProviders}
              disabled={testing.size > 0}
              variant="outline"
            >
              {testing.size > 0 ? 'Testing...' : 'Test All Providers'}
            </Button>
          </div>

          {failedTests > 0 && (
            <Alert className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                {failedTests} provider{failedTests > 1 ? 's' : ''} failed connectivity tests. 
                Check API credentials and network connectivity.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {providers.map((provider) => {
          const isTestingThis = testing.has(provider.name);
          const result = results[provider.name];
          
          return (
            <Card key={provider.name}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {provider.icon}
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {result && (
                      <div className="text-right">
                        <div className="text-sm font-medium flex items-center gap-1">
                          {getStatusIcon(result.status)}
                          {result.responseTime}ms
                        </div>
                        {result.message && (
                          <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {result.message}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {getStatusBadge(result?.status)}
                    
                    <Button
                      onClick={() => testProvider(provider)}
                      disabled={isTestingThis}
                      variant="ghost"
                      size="sm"
                    >
                      {isTestingThis ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};