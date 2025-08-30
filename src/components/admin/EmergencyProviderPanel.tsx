
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProviderTestResult {
  provider: string;
  credentialsValid: boolean;
  authSuccess: boolean;
  error?: string;
}

export const EmergencyProviderPanel = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProviderTestResult[]>([]);
  const [resetResult, setResetResult] = useState<string>('');
  const [rotationResult, setRotationResult] = useState<any>(null);
  const [autoLoading, setAutoLoading] = useState(true);
  const { toast } = useToast();

  // Auto-load authentication test results on component mount
  useEffect(() => {
    const loadAuthenticationStatus = async () => {
      setAutoLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('emergency-provider-fix', {
          body: { action: 'test_auth' }
        });

        if (error) throw error;

        if (data?.results) {
          setResults(data.results);
        }
      } catch (error) {
        console.error('Auto-load authentication test failed:', error);
      } finally {
        setAutoLoading(false);
      }
    };

    loadAuthenticationStatus();
  }, []);

  const executeEmergencyAction = async (action: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-provider-fix', {
        body: { action }
      });

      if (error) throw error;

      switch (action) {
        case 'force_reset_health':
          setResetResult(`✅ Reset ${data.count} providers to healthy status`);
          toast({
            title: "Health Reset Complete",
            description: `${data.count} providers reset to healthy`,
          });
          break;
        
        case 'test_auth':
          setResults(data.results || []);
          const summary = data.summary || { working: 0, total: 0 };
          toast({
            title: "Authentication Test Complete",
            description: `${summary.working}/${summary.total} providers working`,
          });
          break;
        
        case 'test_rotation':
          setRotationResult(data);
          toast({
            title: "Provider Rotation Test",
            description: data.rotationWorking ? "Rotation working!" : "Rotation failed",
            variant: data.rotationWorking ? "default" : "destructive"
          });
          break;
      }
    } catch (error) {
      console.error('Emergency action failed:', error);
      toast({
        title: "Emergency Action Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Emergency Provider Recovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This panel provides emergency tools to fix circuit breaker issues and restore provider functionality.
              Use these tools when providers are stuck in unhealthy states.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => executeEmergencyAction('force_reset_health')}
              disabled={loading}
              variant="destructive"
              className="h-20 flex flex-col gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              <span>Force Reset Health</span>
              <span className="text-xs opacity-80">Clear all unhealthy statuses</span>
            </Button>

            <Button 
              onClick={() => executeEmergencyAction('test_auth')}
              disabled={loading}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>Refresh Authentication</span>
              <span className="text-xs opacity-80">Re-test all provider credentials</span>
            </Button>

            <Button 
              onClick={() => executeEmergencyAction('test_rotation')}
              disabled={loading}
              variant="secondary"
              className="h-20 flex flex-col gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              <span>Test Rotation</span>
              <span className="text-xs opacity-80">Verify provider rotation works</span>
            </Button>
          </div>

          {resetResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{resetResult}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Auto-loaded or manually tested authentication results */}
      {(autoLoading || results.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Provider Authentication Status</span>
              {autoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {autoLoading ? (
              <div className="text-center py-4">
                <div className="text-muted-foreground">Testing provider authentication...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.provider} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.authSuccess ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-medium capitalize">{result.provider}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.authSuccess ? "default" : "destructive"}>
                        {result.authSuccess ? "Working" : "Failed"}
                      </Badge>
                      {result.error && (
                        <span className="text-sm text-muted-foreground max-w-xs truncate">
                          {result.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Provider rotation test results */}
      {rotationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Rotation Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {rotationResult.rotationWorking ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">
                  Rotation Status: {rotationResult.rotationWorking ? "Working" : "Failed"}
                </span>
              </div>
              
              {rotationResult.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{rotationResult.error}</AlertDescription>
                </Alert>
              )}

              {rotationResult.result && (
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(rotationResult.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
