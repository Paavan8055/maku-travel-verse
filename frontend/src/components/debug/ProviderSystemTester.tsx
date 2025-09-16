import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  service: string;
  provider: string;
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

export const ProviderSystemTester = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runSystemTest = async () => {
    setTesting(true);
    setResults([]);
    
    const tests = [
      {
        service: 'flight',
        params: {
          searchType: 'flight',
          params: {
            originLocationCode: 'SYD',
            destinationLocationCode: 'MEL', 
            departureDate: '2025-09-12',
            adults: 1
          }
        }
      },
      {
        service: 'hotel',
        params: {
          searchType: 'hotel',
          params: {
            cityCode: 'SYD',
            checkInDate: '2025-09-15',
            checkOutDate: '2025-09-16',
            adults: 2,
            roomQuantity: 1
          }
        }
      },
      {
        service: 'activity',
        params: {
          searchType: 'activity',
          params: {
            destination: 'sydney',
            date: '2025-09-15',
            participants: 2
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        
        console.log(`Testing ${test.service} with params:`, test.params);
        
        const { data, error } = await supabase.functions.invoke('provider-rotation', {
          body: test.params
        });
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          console.error(`${test.service} test failed:`, error);
          setResults(prev => [...prev, {
            service: test.service,
            provider: 'Error',
            success: false,
            responseTime,
            error: error.message
          }]);
        } else {
          console.log(`${test.service} test succeeded:`, data);
          setResults(prev => [...prev, {
            service: test.service,
            provider: data?.provider || 'Unknown',
            success: data?.success || false,
            responseTime,
            data: data?.data,
            error: data?.error
          }]);
        }
      } catch (error) {
        console.error(`${test.service} test crashed:`, error);
        setResults(prev => [...prev, {
          service: test.service,
          provider: 'System Error',
          success: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]);
      }
    }
    
    setTesting(false);
  };

  const getStatusIcon = (success: boolean, error?: string) => {
    if (error && error.includes('502')) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (success) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const getStatusColor = (success: boolean, error?: string) => {
    if (error && error.includes('502')) {
      return 'destructive';
    }
    if (success) {
      return 'default';
    }
    return 'secondary';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Provider System Test
          {testing && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSystemTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Run System Test'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.success, result.error)}
                  <div>
                    <div className="font-medium capitalize">{result.service}</div>
                    <div className="text-sm text-muted-foreground">
                      Provider: {result.provider} | {result.responseTime}ms
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(result.success, result.error)}>
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                  {result.data && Array.isArray(result.data) && (
                    <Badge variant="outline">
                      {result.data.length} results
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {results.some(r => r.error) && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Errors Found:</h4>
                <div className="space-y-1 text-sm">
                  {results.filter(r => r.error).map((result, index) => (
                    <div key={index}>
                      <strong>{result.service}:</strong> {result.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};