import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  success: boolean;
  provider?: string;
  results?: number;
  error?: string;
  responseTime?: number;
}

export function DuffelTestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const runDuffelTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Test direct Duffel flight search
      const { data, error } = await supabase.functions.invoke('duffel-flight-search', {
        body: {
          origin: 'SYD',
          destination: 'MEL', 
          departureDate: '2025-01-15',
          adults: 1,
          cabin: 'economy',
          max: 5
        }
      });

      if (error) {
        setTestResult({
          success: false,
          error: error.message
        });
        toast({
          title: "Duffel Test Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setTestResult({
        success: data?.success || false,
        provider: 'Duffel',
        results: data?.data?.length || 0,
        error: data?.success ? undefined : data?.error
      });

      if (data?.success) {
        toast({
          title: "Duffel Test Successful",
          description: `Found ${data.data?.length || 0} flight offers`,
        });
      } else {
        toast({
          title: "Duffel Test Failed", 
          description: data?.error || "Unknown error",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult({
        success: false,
        error: errorMessage
      });
      toast({
        title: "Test Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testProviderRotation = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Test provider rotation with flight search
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'flight',
          params: {
            origin: 'SYD',
            destination: 'MEL',
            departureDate: '2025-01-15',
            adults: 1,
            cabin: 'economy'
          }
        }
      });

      if (error) {
        setTestResult({
          success: false,
          error: error.message
        });
        toast({
          title: "Provider Rotation Test Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setTestResult({
        success: data?.success || false,
        provider: data?.provider,
        results: data?.data?.length || 0,
        responseTime: data?.responseTime,
        error: data?.success ? undefined : data?.error
      });

      if (data?.success) {
        toast({
          title: "Provider Rotation Test Successful",
          description: `${data.provider} returned ${data.data?.length || 0} results`,
        });
      } else {
        toast({
          title: "Provider Rotation Test Failed", 
          description: data?.error || "Unknown error",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult({
        success: false,
        error: errorMessage
      });
      toast({
        title: "Test Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Duffel Integration Test
        </CardTitle>
        <CardDescription>
          Test the Duffel API integration both directly and through provider rotation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDuffelTest} 
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              'Test Direct Duffel'
            )}
          </Button>
          
          <Button 
            onClick={testProviderRotation} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              'Test Provider Rotation'
            )}
          </Button>
        </div>

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "✅ Test Passed" : "❌ Test Failed"}
              </Badge>
              {testResult.provider && (
                <Badge variant="outline">
                  {testResult.provider}
                </Badge>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  <span className="font-medium">Flight Search</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        {testResult.results} results
                        {testResult.responseTime && ` (${testResult.responseTime}ms)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">
                        {testResult.error || 'Failed'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}