import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProviderTestResult {
  success: boolean;
  provider: string;
  endpoints?: {
    name: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    responseTime?: number;
  }[];
  credentials?: {
    configured: boolean;
    details: string;
  };
  error?: string;
  timestamp: string;
}

interface TestSuiteResults {
  amadeus: ProviderTestResult | null;
  sabre: ProviderTestResult | null;
  hotelbeds: ProviderTestResult | null;
  overall: {
    healthy: number;
    total: number;
    status: 'healthy' | 'degraded' | 'critical';
  };
}

export function CredentialTestSuite() {
  const [results, setResults] = useState<TestSuiteResults>({
    amadeus: null,
    sabre: null,
    hotelbeds: null,
    overall: { healthy: 0, total: 0, status: 'critical' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTests, setActiveTests] = useState<Set<string>>(new Set());

  const testProvider = async (provider: 'amadeus' | 'sabre' | 'hotelbeds') => {
    setActiveTests(prev => new Set([...prev, provider]));
    
    try {
      let testResult: ProviderTestResult;
      
      switch (provider) {
        case 'amadeus':
          testResult = await testAmadeusCredentials();
          break;
        case 'sabre':
          testResult = await testSabreCredentials();
          break;
        case 'hotelbeds':
          testResult = await testHotelBedsCredentials();
          break;
        default:
          throw new Error('Unknown provider');
      }
      
      setResults(prev => ({
        ...prev,
        [provider]: testResult,
        overall: calculateOverallStatus({
          ...prev,
          [provider]: testResult
        })
      }));
      
      if (testResult.success) {
        toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} credentials verified`);
      } else {
        toast.error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} test failed`);
      }
    } catch (error) {
      const errorResult: ProviderTestResult = {
        success: false,
        provider,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setResults(prev => ({
        ...prev,
        [provider]: errorResult,
        overall: calculateOverallStatus({
          ...prev,
          [provider]: errorResult
        })
      }));
      
      toast.error(`Failed to test ${provider} credentials`);
    } finally {
      setActiveTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(provider);
        return newSet;
      });
    }
  };

  const testAllProviders = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        testProvider('amadeus'),
        testProvider('sabre'),
        testProvider('hotelbeds')
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const testAmadeusCredentials = async (): Promise<ProviderTestResult> => {
    const { data, error } = await supabase.functions.invoke('amadeus-health');
    
    if (error) throw error;
    
    return {
      success: data?.success || false,
      provider: 'amadeus',
      endpoints: [
        {
          name: 'Authentication',
          status: data?.auth?.success ? 'success' : 'error',
          message: data?.auth?.message || 'Authentication test failed',
          responseTime: data?.auth?.responseTime
        },
        {
          name: 'Flight Search API',
          status: data?.flightSearch?.success ? 'success' : 'warning',
          message: data?.flightSearch?.message || 'Flight search endpoint not tested',
          responseTime: data?.flightSearch?.responseTime
        },
        {
          name: 'Hotel Search API',
          status: data?.hotelSearch?.success ? 'success' : 'warning',
          message: data?.hotelSearch?.message || 'Hotel search endpoint not tested',
          responseTime: data?.hotelSearch?.responseTime
        }
      ],
      credentials: {
        configured: !!(data?.credentials?.clientId && data?.credentials?.clientSecret),
        details: `Client ID: ${data?.credentials?.clientId ? 'configured' : 'missing'}, Secret: ${data?.credentials?.clientSecret ? 'configured' : 'missing'}`
      },
      timestamp: new Date().toISOString()
    };
  };

  const testSabreCredentials = async (): Promise<ProviderTestResult> => {
    // Test Sabre authentication by trying to get a token
    const { data, error } = await supabase.functions.invoke('sabre-health');
    
    if (error) throw error;
    
    return {
      success: data?.success || false,
      provider: 'sabre',
      endpoints: [
        {
          name: 'Authentication',
          status: data?.auth?.success ? 'success' : 'error',
          message: data?.auth?.message || 'Authentication failed',
          responseTime: data?.auth?.responseTime
        },
        {
          name: 'Flight Search API',
          status: data?.flightSearch?.available ? 'success' : 'warning',
          message: data?.flightSearch?.message || 'Flight search not available',
        },
        {
          name: 'Hotel Search API',
          status: data?.hotelSearch?.available ? 'success' : 'warning',
          message: data?.hotelSearch?.message || 'Hotel search not available',
        }
      ],
      credentials: {
        configured: !!(data?.credentials?.clientId && data?.credentials?.clientSecret),
        details: `Client ID: ${data?.credentials?.clientId ? 'configured' : 'missing'}, Secret: ${data?.credentials?.clientSecret ? 'configured' : 'missing'}`
      },
      timestamp: new Date().toISOString()
    };
  };

  const testHotelBedsCredentials = async (): Promise<ProviderTestResult> => {
    const { data, error } = await supabase.functions.invoke('hotelbeds-credential-test');
    
    if (error) throw error;
    
    const hotelReady = data?.results?.summary?.hotelReady || false;
    const activityReady = data?.results?.summary?.activityReady || false;
    
    return {
      success: data?.success || false,
      provider: 'hotelbeds',
      endpoints: [
        {
          name: 'Hotel Service',
          status: hotelReady ? 'success' : 'error',
          message: hotelReady ? 'Hotel credentials configured' : 'Hotel credentials missing or invalid'
        },
        {
          name: 'Activity Service',
          status: activityReady ? 'success' : 'error',
          message: activityReady ? 'Activity credentials configured' : 'Activity credentials missing or invalid'
        },
        {
          name: 'Generic Fallback',
          status: data?.results?.generic?.hasGenericCredentials ? 'success' : 'warning',
          message: data?.results?.generic?.hasGenericCredentials ? 'Generic credentials available' : 'No generic fallback'
        }
      ],
      credentials: {
        configured: hotelReady || activityReady,
        details: data?.results?.summary?.recommendedAction || 'Credential status unknown'
      },
      timestamp: new Date().toISOString()
    };
  };

  const calculateOverallStatus = (testResults: Omit<TestSuiteResults, 'overall'>): TestSuiteResults['overall'] => {
    const providers = [testResults.amadeus, testResults.sabre, testResults.hotelbeds];
    const total = providers.filter(p => p !== null).length;
    const healthy = providers.filter(p => p?.success).length;
    
    let status: 'healthy' | 'degraded' | 'critical';
    if (healthy === total && total > 0) {
      status = 'healthy';
    } else if (healthy > 0) {
      status = 'degraded';
    } else {
      status = 'critical';
    }
    
    return { healthy, total, status };
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getOverallStatusIcon = () => {
    switch (results.overall.status) {
      case 'healthy':
        return <Wifi className="h-5 w-5 text-success" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'critical':
        return <WifiOff className="h-5 w-5 text-destructive" />;
    }
  };

  const renderProviderTest = (provider: 'amadeus' | 'sabre' | 'hotelbeds') => {
    const result = results[provider];
    const isLoading = activeTests.has(provider);
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="capitalize">{provider}</CardTitle>
              <CardDescription>
                {provider === 'amadeus' && 'Flight, Hotel & Activity search provider'}
                {provider === 'sabre' && 'Flight & Hotel search provider'}
                {provider === 'hotelbeds' && 'Hotel & Activity booking provider'}
              </CardDescription>
            </div>
            <Button
              onClick={() => testProvider(provider)}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Status</span>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Connected" : "Failed"}
                </Badge>
              </div>

              {result.credentials && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Credentials</span>
                    {result.credentials.configured ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.credentials.details}
                  </p>
                </div>
              )}

              {result.endpoints && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Endpoints</h4>
                  {result.endpoints.map((endpoint, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-card border rounded text-sm">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(endpoint.status)}
                        <span>{endpoint.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">{endpoint.message}</div>
                        {endpoint.responseTime && (
                          <div className="text-xs text-muted-foreground">{endpoint.responseTime}ms</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                  <div className="font-medium text-destructive mb-1">Error</div>
                  <div className="text-muted-foreground">{result.error}</div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Tested: {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click "Test" to validate {provider} credentials</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getOverallStatusIcon()}
              <div>
                <CardTitle>Provider Credential Status</CardTitle>
                <CardDescription>
                  Test all API provider credentials and connections
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right text-sm">
                <div className="font-medium">
                  {results.overall.healthy}/{results.overall.total} Providers Healthy
                </div>
                <Badge variant={
                  results.overall.status === 'healthy' ? 'default' :
                  results.overall.status === 'degraded' ? 'secondary' : 'destructive'
                }>
                  {results.overall.status}
                </Badge>
              </div>
              <Button
                onClick={testAllProviders}
                disabled={isLoading}
                variant="default"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Test All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="amadeus" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="amadeus" className="flex items-center space-x-2">
            <span>Amadeus</span>
            {results.amadeus && (
              results.amadeus.success ? 
                <CheckCircle className="h-3 w-3 text-success" /> : 
                <XCircle className="h-3 w-3 text-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="sabre" className="flex items-center space-x-2">
            <span>Sabre</span>
            {results.sabre && (
              results.sabre.success ? 
                <CheckCircle className="h-3 w-3 text-success" /> : 
                <XCircle className="h-3 w-3 text-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="hotelbeds" className="flex items-center space-x-2">
            <span>HotelBeds</span>
            {results.hotelbeds && (
              results.hotelbeds.success ? 
                <CheckCircle className="h-3 w-3 text-success" /> : 
                <XCircle className="h-3 w-3 text-destructive" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="amadeus">
          {renderProviderTest('amadeus')}
        </TabsContent>
        
        <TabsContent value="sabre">
          {renderProviderTest('sabre')}
        </TabsContent>
        
        <TabsContent value="hotelbeds">
          {renderProviderTest('hotelbeds')}
        </TabsContent>
      </Tabs>
    </div>
  );
}