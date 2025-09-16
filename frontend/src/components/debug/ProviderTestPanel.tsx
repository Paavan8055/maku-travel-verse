import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface TestResult {
  service: string;
  success: boolean;
  provider?: string;
  resultCount: number;
  responseTime?: number;
  error?: string;
  details?: any;
}

export const ProviderTestPanel = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const testConfigs = [
      {
        service: 'Hotels',
        searchType: 'hotel',
        params: {
          destination: 'sydney',
          checkIn: '2025-08-25',
          checkOut: '2025-08-26',
          adults: 2,
          children: 0,
          rooms: 1,
          currency: 'AUD'
        }
      },
      {
        service: 'Flights',
        searchType: 'flight',
        params: {
          origin: 'SYD',
          destination: 'MEL',
          departureDate: '2025-08-25',
          passengers: 1,
          travelClass: 'ECONOMY',
          currency: 'AUD'
        }
      },
      {
        service: 'Activities',
        searchType: 'activity',
        params: {
          destination: 'sydney',
          dateFrom: '2025-08-25',
          dateTo: '2025-08-26',
          currency: 'AUD'
        }
      }
    ];

    for (const config of testConfigs) {
      try {
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: config.searchType,
            params: config.params
          }
        });

        const responseTime = Date.now() - startTime;

        if (error) {
          setResults(prev => [...prev, {
            service: config.service,
            success: false,
            resultCount: 0,
            responseTime,
            error: error.message || 'Unknown error'
          }]);
        } else {
          const resultCount = data?.data?.length || 0;
          setResults(prev => [...prev, {
            service: config.service,
            success: data?.success || false,
            provider: data?.provider,
            resultCount,
            responseTime,
            details: data
          }]);
        }
      } catch (err) {
        setResults(prev => [...prev, {
          service: config.service,
          success: false,
          resultCount: 0,
          error: err instanceof Error ? err.message : 'Test failed'
        }]);
      }
    }

    setTesting(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Provider Rotation Test Panel
        </CardTitle>
        <CardDescription>
          Test all provider rotations to verify system functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run All Provider Tests'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <h3 className="font-semibold">Test Results</h3>
            
            {results.map((result, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.success)}
                      <div>
                        <h4 className="font-medium">{result.service}</h4>
                        {result.provider && (
                          <Badge variant="secondary" className="mt-1">
                            {result.provider}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{result.resultCount} results</div>
                      {result.responseTime && (
                        <div>{result.responseTime}ms</div>
                      )}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                      {result.error}
                    </div>
                  )}
                  
                  {result.details && result.success && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Provider: {result.details.provider || 'Unknown'} | 
                      Source: {result.details.source || 'API'} |
                      {result.details.fallbackUsed && ' Fallback Used'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};