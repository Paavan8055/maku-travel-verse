import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  duration?: number;
}

export const DeploymentDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const { toast } = useToast();

  const runDiagnostic = async (name: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      return {
        name,
        status: 'success' as const,
        message: 'Test passed',
        data: result,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        name,
        status: 'error' as const,
        message: error.message || 'Test failed',
        data: error,
        duration
      };
    }
  };

  const runAllDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    const diagnostics = [
      {
        name: 'Deployment Validator',
        test: () => supabase.functions.invoke('deployment-validator')
      },
      {
        name: 'Critical Debug',
        test: () => supabase.functions.invoke('critical-debug')
      },
      {
        name: 'Provider Rotation',
        test: () => supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'hotel',
            params: {
              destination: 'sydney',
              checkIn: '2025-08-25',
              checkOut: '2025-08-26',
              guests: 2,
              rooms: 1,
              currency: 'AUD'
            }
          }
        })
      },
      {
        name: 'Health Check',
        test: () => supabase.functions.invoke('health-check')
      },
      {
        name: 'Provider Configs Query',
        test: async () => {
          const { data, error } = await supabase.from('provider_configs').select('*').eq('enabled', true);
          if (error) throw error;
          return data;
        }
      }
    ];

    const newResults: DiagnosticResult[] = [];
    
    for (const diagnostic of diagnostics) {
      const result = await runDiagnostic(diagnostic.name, diagnostic.test);
      newResults.push(result);
      setResults([...newResults]);
    }

    setIsRunning(false);
    
    const failedTests = newResults.filter(r => r.status === 'error').length;
    if (failedTests > 0) {
      toast({
        title: "Diagnostics Complete",
        description: `${failedTests} test(s) failed. Check results below.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "All Tests Passed",
        description: "Deployment appears to be working correctly.",
        variant: "default"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Deployment Diagnostics</CardTitle>
        <CardDescription>
          Test Supabase Edge Functions and database connectivity to verify deployment status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runAllDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            'Run Deployment Diagnostics'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <span className="text-sm text-muted-foreground">
                        {result.duration}ms
                      </span>
                    )}
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                {result.data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};