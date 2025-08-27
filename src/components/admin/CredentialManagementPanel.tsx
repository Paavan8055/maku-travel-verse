import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Shield,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';

interface CredentialStatus {
  provider: string;
  credentials: {
    [key: string]: {
      exists: boolean;
      length?: number;
      prefix?: string;
      isValid?: boolean;
    };
  };
  authTest?: {
    success: boolean;
    error?: string;
    responseTime?: number;
  };
}

export function CredentialManagementPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [credentialStatuses, setCredentialStatuses] = useState<CredentialStatus[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const checkAllCredentials = async () => {
    setIsLoading(true);
    
    try {
      const providers = ['amadeus', 'sabre', 'hotelbeds'];
      const results: CredentialStatus[] = [];
      
      for (const provider of providers) {
        try {
          let data;
          
          if (provider === 'sabre') {
            const response = await supabase.functions.invoke('debug-sabre-credentials');
            data = response.data;
            
            results.push({
              provider: 'sabre',
              credentials: data.environment,
              authTest: data.authTest
            });
          } else if (provider === 'hotelbeds') {
            const response = await supabase.functions.invoke('hotelbeds-credential-test');
            data = response.data;
            
            if (data.results) {
              results.push({
                provider: 'hotelbeds',
                credentials: {
                  'HOTELBEDS_API_KEY': {
                    exists: data.results.hotel.hasCredentials,
                    length: data.results.hotel.apiKeyLength
                  },
                  'HOTELBEDS_SECRET': {
                    exists: data.results.hotel.hasCredentials,
                    length: data.results.hotel.secretLength
                  }
                }
              });
            }
          } else {
            // Amadeus - use credential test
            const response = await supabase.functions.invoke('credential-test', {
              body: { provider: 'amadeus' }
            });
            data = response.data;
            
            results.push({
              provider: 'amadeus',
              credentials: {
                'AMADEUS_CLIENT_ID': {
                  exists: data.credentialsValid,
                  isValid: data.authSuccess
                },
                'AMADEUS_CLIENT_SECRET': {
                  exists: data.credentialsValid,
                  isValid: data.authSuccess
                }
              },
              authTest: {
                success: data.authSuccess,
                error: data.error
              }
            });
          }
        } catch (error) {
          results.push({
            provider,
            credentials: {},
            authTest: {
              success: false,
              error: error instanceof Error ? error.message : 'Test failed'
            }
          });
        }
      }
      
      setCredentialStatuses(results);
      setLastCheckTime(new Date());
      toast.success('Credential check completed');
      
    } catch (error) {
      toast.error('Failed to check credentials: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const openSecretsManagement = () => {
    window.open('https://supabase.com/dashboard/project/iomeddeasarntjhqzndu/settings/functions', '_blank');
  };

  const getCredentialIcon = (credential: { exists: boolean; isValid?: boolean }) => {
    if (!credential.exists) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (credential.isValid === false) {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getCredentialBadge = (credential: { exists: boolean; isValid?: boolean }) => {
    if (!credential.exists) {
      return <Badge variant="destructive">Missing</Badge>;
    }
    if (credential.isValid === false) {
      return <Badge variant="outline" className="border-amber-500 text-amber-700">Invalid</Badge>;
    }
    return <Badge className="bg-green-600">Valid</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Credential Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Verify and manage API credentials for all providers
            </p>
            {lastCheckTime && (
              <p className="text-xs text-muted-foreground mt-1">
                Last checked: {lastCheckTime.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={openSecretsManagement}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Secrets
            </Button>
            <Button
              onClick={checkAllCredentials}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Check All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Alert className="mb-4">
          <Settings2 className="h-4 w-4" />
          <AlertDescription>
            Ensure all API keys are configured in Supabase Edge Functions secrets.
            Missing or invalid credentials will cause provider failures.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amadeus">Amadeus</TabsTrigger>
            <TabsTrigger value="sabre">Sabre</TabsTrigger>
            <TabsTrigger value="hotelbeds">HotelBeds</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {credentialStatuses.length > 0 ? (
              <div className="space-y-3">
                {credentialStatuses.map((status) => (
                  <div key={status.provider} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{status.provider}</h4>
                      {status.authTest && (
                        <Badge 
                          variant={status.authTest.success ? 'default' : 'destructive'}
                          className={status.authTest.success ? 'bg-green-600' : ''}
                        >
                          {status.authTest.success ? 'Connected' : 'Auth Failed'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      {Object.entries(status.credentials).map(([key, credential]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="font-mono">{key}</span>
                          <div className="flex items-center gap-2">
                            {getCredentialIcon(credential)}
                            {getCredentialBadge(credential)}
                            {credential.length && (
                              <span className="text-xs text-muted-foreground">
                                {credential.length} chars
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {status.authTest?.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        Error: {status.authTest.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click "Check All" to verify provider credentials</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="amadeus" className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Required Amadeus Credentials:</h4>
              <ul className="text-sm space-y-1">
                <li><code>AMADEUS_CLIENT_ID</code> - OAuth2 client identifier</li>
                <li><code>AMADEUS_CLIENT_SECRET</code> - OAuth2 client secret</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="sabre" className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Required Sabre Credentials:</h4>
              <ul className="text-sm space-y-1">
                <li><code>SABRE_CLIENT_ID</code> - REST API client ID</li>
                <li><code>SABRE_CLIENT_SECRET</code> - REST API client secret</li>
                <li><code>SABRE_BASE_URL</code> - API base URL (test/production)</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="hotelbeds" className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Required HotelBeds Credentials:</h4>
              <ul className="text-sm space-y-1">
                <li><code>HOTELBEDS_API_KEY</code> - API key for authentication</li>
                <li><code>HOTELBEDS_SECRET</code> - Shared secret for signature generation</li>
                <li><code>HOTELBEDS_HOTEL_API_KEY</code> - Service-specific hotel API key (optional)</li>
                <li><code>HOTELBEDS_ACTIVITY_API_KEY</code> - Service-specific activity API key (optional)</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}