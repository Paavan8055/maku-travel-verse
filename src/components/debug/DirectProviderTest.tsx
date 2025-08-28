import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Activity, Plane, Hotel } from 'lucide-react';

interface TestResult {
  service: string;
  success: boolean;
  provider?: string;
  resultCount: number;
  responseTime: number;
  error?: string;
}

export function DirectProviderTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runDirectTests = async () => {
    setIsLoading(true);
    const results: TestResult[] = [];
    
    const testConfigs = [
      {
        service: 'Hotels',
        searchType: 'hotel',
        params: {
          destination: 'Sydney',
          checkIn: '2025-08-30',
          checkOut: '2025-09-01',
          guests: 2,
          rooms: 1
        }
      },
      {
        service: 'Activities',
        searchType: 'activity', 
        params: {
          destination: 'Sydney',
          date: '2025-08-30',
          participants: 2
        }
      }
    ];

    console.log('🚀 Starting direct provider rotation tests...');

    for (const config of testConfigs) {
      try {
        console.log(`🔍 Testing ${config.service} provider rotation...`, config);
        const startTime = Date.now();
        const { data, error } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: config.searchType,
            params: config.params
          }
        });
        const responseTime = Date.now() - startTime;
        
        console.log(`📡 ${config.service} response:`, { data, error, responseTime });
        
        if (error) {
          results.push({
            service: config.service,
            success: false,
            provider: 'N/A',
            resultCount: 0,
            responseTime,
            error: error.message
          });
        } else {
          const resultCount = Array.isArray(data?.data) ? data.data.length : 0;
          results.push({
            service: config.service,
            success: data?.success || false,
            provider: data?.provider || 'Unknown',
            resultCount,
            responseTime,
            error: data?.success ? undefined : (data?.error || 'Unknown error')
          });
        }
      } catch (err) {
        console.error(`❌ ${config.service} test failed:`, err);
        results.push({
          service: config.service,
          success: false,
          provider: 'N/A',
          resultCount: 0,
          responseTime: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    console.log('✅ Direct provider rotation tests completed:', results);
    setTestResults(results);
    setIsLoading(false);
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Hotels': return <Hotel className="h-4 w-4" />;
      case 'Activities': return <Activity className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Direct Provider Test
        </CardTitle>
        <CardDescription>
          Directly test provider-rotation function to debug integration issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDirectTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Direct Tests...
            </>
          ) : (
            'Test Provider Rotation Directly'
          )}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">
              Results: {testResults.filter(r => r.success).length}/{testResults.length} services working
            </div>
            
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getServiceIcon(result.service)}
                  <span className="font-medium">{result.service}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        {result.provider} ({result.resultCount} results, {result.responseTime}ms)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">
                        {result.error || 'Failed'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}