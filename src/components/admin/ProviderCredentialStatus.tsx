import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ProviderStatus {
  provider: string;
  credentialsValid: boolean;
  authSuccess: boolean;
  environment: string;
  error?: string;
  service?: string[];
}

interface CredentialTestResult {
  environment: string;
  providers: ProviderStatus[];
  summary: {
    total: number;
    working: number;
    failed: number;
  };
}

export const ProviderCredentialStatus = () => {
  const [testResults, setTestResults] = useState<CredentialTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const testCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-credential-test', {
        body: {}
      });

      if (error) throw error;
      
      setTestResults(data);
      setLastTestTime(new Date());
    } catch (error) {
      console.error('Credential test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testCredentials();
  }, []);

  const getStatusIcon = (provider: ProviderStatus) => {
    if (!provider.credentialsValid) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (provider.authSuccess) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  const getStatusBadge = (provider: ProviderStatus) => {
    if (!provider.credentialsValid) {
      return <Badge variant="destructive">Missing Credentials</Badge>;
    }
    if (provider.authSuccess) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Connected</Badge>;
    }
    return <Badge variant="outline" className="border-amber-500 text-amber-700">Auth Failed</Badge>;
  };

  const getProviderDisplayName = (provider: string) => {
    const displayNames: Record<string, string> = {
      'amadeus': 'Amadeus',
      'sabre': 'Sabre',
      'duffel': 'Duffel',
      'hotelbeds-hotel': 'HotelBeds Hotels',
      'hotelbeds-activity': 'HotelBeds Activities'
    };
    return displayNames[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Provider Credential Status</CardTitle>
          <Button 
            onClick={testCredentials} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test All
          </Button>
        </div>
        {testResults && (
          <div className="text-sm text-muted-foreground">
            Environment: <Badge variant="outline">{testResults.environment}</Badge>
            {lastTestTime && (
              <span className="ml-2">Last tested: {lastTestTime.toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {testResults ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{testResults.summary.working}</div>
                <div className="text-muted-foreground">Working</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{testResults.summary.failed}</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{testResults.summary.total}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>

            <div className="space-y-3">
              {testResults.providers.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(provider)}
                    <div>
                      <div className="font-medium capitalize flex items-center gap-2">
                        {getProviderDisplayName(provider.provider)}
                        {provider.service && provider.service.length > 0 && (
                          <div className="flex gap-1">
                            {provider.service.map(service => (
                              <Badge key={service} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {provider.error && (
                        <div className="text-sm text-destructive mt-1">{provider.error}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(provider)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-muted-foreground">
              {isLoading ? 'Testing credentials...' : 'No test results available'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};