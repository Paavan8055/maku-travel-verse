import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HotelBedsTestResult {
  success: boolean;
  results?: {
    hotel: {
      hasCredentials: boolean;
      apiKeyLength: number;
      secretLength: number;
      usingServiceSpecific: boolean;
    };
    activity: {
      hasCredentials: boolean;
      apiKeyLength: number;
      secretLength: number;
      usingServiceSpecific: boolean;
    };
    generic: {
      hasGenericCredentials: boolean;
      apiKeyLength: number;
      secretLength: number;
    };
    summary: {
      hotelReady: boolean;
      activityReady: boolean;
      recommendedAction: string;
    };
  };
  error?: string;
  timestamp?: string;
}

export function HotelBedsCredentialTest() {
  const [testResult, setTestResult] = useState<HotelBedsTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);

  const testCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hotelbeds-credential-test');
      
      if (error) {
        throw new Error(error.message);
      }

      setTestResult(data);
      setLastTestTime(new Date().toLocaleTimeString());
      
      if (data.success) {
        toast.success('HotelBeds credential test completed');
      } else {
        toast.error('HotelBeds credential test failed');
      }
    } catch (error) {
      console.error('Credential test failed:', error);
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast.error('Failed to test HotelBeds credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (hasCredentials: boolean) => {
    return hasCredentials ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  const getStatusBadge = (hasCredentials: boolean) => {
    return hasCredentials ? (
      <Badge variant="default" className="bg-success text-success-foreground">
        Configured
      </Badge>
    ) : (
      <Badge variant="destructive">Missing</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>HotelBeds Credential Test</CardTitle>
            <CardDescription>
              Test HotelBeds API credentials configuration
              {lastTestTime && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Last tested: {lastTestTime}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            onClick={testCredentials}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Credentials
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {testResult && (
          <div className="space-y-4">
            {testResult.success && testResult.results ? (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Summary
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {testResult.results.summary.recommendedAction}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Hotel Service:</span>
                      {getStatusBadge(testResult.results.summary.hotelReady)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Activity Service:</span>
                      {getStatusBadge(testResult.results.summary.activityReady)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card border rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(testResult.results.hotel.hasCredentials)}
                      <span className="font-medium">Hotel Credentials</span>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>API Key: {testResult.results.hotel.apiKeyLength} chars</div>
                      <div>Secret: {testResult.results.hotel.secretLength} chars</div>
                      {testResult.results.hotel.usingServiceSpecific && (
                        <Badge variant="secondary" className="mt-1">Service-specific</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-card border rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(testResult.results.activity.hasCredentials)}
                      <span className="font-medium">Activity Credentials</span>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>API Key: {testResult.results.activity.apiKeyLength} chars</div>
                      <div>Secret: {testResult.results.activity.secretLength} chars</div>
                      {testResult.results.activity.usingServiceSpecific && (
                        <Badge variant="secondary" className="mt-1">Service-specific</Badge>
                      )}
                    </div>
                  </div>

                  {testResult.results.generic.hasGenericCredentials && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Generic Fallback</span>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>API Key: {testResult.results.generic.apiKeyLength} chars</div>
                        <div>Secret: {testResult.results.generic.secretLength} chars</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center space-x-2 text-destructive mb-2">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Test Failed</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {testResult.error || 'Unknown error occurred'}
                </p>
              </div>
            )}

            {testResult.timestamp && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                Test completed at: {new Date(testResult.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {!testResult && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click "Test Credentials" to validate HotelBeds API configuration</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}