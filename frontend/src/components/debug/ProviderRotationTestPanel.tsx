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
  results: number;
  error?: string;
}

interface TestResponse {
  success: boolean;
  timestamp: string;
  testResults: TestResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export function ProviderRotationTestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResponse | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-provider-rotation');
      
      if (error) {
        throw error;
      }

      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        success: false,
        timestamp: new Date().toISOString(),
        testResults: [],
        summary: { total: 0, successful: 0, failed: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'activity': return <Activity className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Provider Rotation Test
        </CardTitle>
        <CardDescription>
          Test all provider rotation services (hotels, flights, activities) to verify they're working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Provider Rotation Tests'
          )}
        </Button>

        {testResults && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={testResults.success ? "default" : "destructive"}>
                {testResults.success ? "✅ Tests Completed" : "❌ Tests Failed"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {testResults.timestamp}
              </span>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">
                Summary: {testResults.summary.successful}/{testResults.summary.total} services working
              </div>
              
              {testResults.testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(result.service)}
                    <span className="font-medium capitalize">{result.service}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          {result.provider} ({result.results} results)
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}