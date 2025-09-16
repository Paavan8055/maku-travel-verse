import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FoundationTest {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  details?: any;
  message?: string;
}

interface FoundationResults {
  timestamp: string;
  tests: FoundationTest[];
  summary: {
    passed: number;
    failed: number;
  };
}

export function FoundationRepairPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FoundationResults | null>(null);
  const { toast } = useToast();

  const runFoundationTests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('foundation-repair-test');
      
      if (error) {
        throw error;
      }
      
      setResults(data);
      
      const hasFailures = data.summary.failed > 0;
      toast({
        title: hasFailures ? "Foundation Issues Found" : "Foundation Tests Passed",
        description: `${data.summary.passed} passed, ${data.summary.failed} failed`,
        variant: hasFailures ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Foundation test failed:', error);
      toast({
        title: "Foundation Test Failed",
        description: error.message || "Failed to execute foundation tests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Foundation Repair Tests
            </CardTitle>
            <CardDescription>
              Validate core system components and provider configurations
            </CardDescription>
          </div>
          <Button 
            onClick={runFoundationTests} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isLoading ? 'Testing...' : 'Run Foundation Tests'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {results && (
          <>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Summary:</span> {results.summary.passed} passed, {results.summary.failed} failed
              </div>
              <div className="text-xs text-muted-foreground">
                Last run: {new Date(results.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="space-y-3">
              {results.tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      {test.message && (
                        <div className="text-sm text-muted-foreground">{test.message}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
            </div>

            {results.summary.failed > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Critical Issues Found</h4>
                <div className="text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {results.tests
                      .filter(test => test.status === 'failed')
                      .map((test, index) => (
                        <li key={index}>
                          {test.name}: {test.details?.error || 'Configuration missing'}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {!results && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Run foundation tests to validate system configuration</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}