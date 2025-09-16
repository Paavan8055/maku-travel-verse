import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SabreDebugResult {
  success: boolean;
  environment: Record<string, any>;
  authTest?: any;
  pccTests?: any[];
  recommendations?: any;
  timestamp: string;
}

export const SabreDebugPanel: React.FC = () => {
  const [debugResult, setDebugResult] = useState<SabreDebugResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebugTest = async () => {
    setIsLoading(true);
    setError(null);
    setDebugResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('debug-sabre-credentials', {
        body: {}
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setDebugResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Sabre Authentication Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDebugTest} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Sabre Debug Test'
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {debugResult && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Environment Variables</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(debugResult.environment).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2">
                    {renderStatusIcon(value.exists)}
                    <span className="font-mono">{key}</span>
                    <span className="text-gray-500">
                      {value.exists ? `${value.length || 0} chars` : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {debugResult.pccTests && debugResult.pccTests.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">PCC Authentication Tests</h3>
                <div className="space-y-3">
                  {debugResult.pccTests.map((test, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded border">
                      {renderStatusIcon(test.success)}
                      <div className="flex-1">
                        <p className="font-medium">
                          {test.type.toUpperCase()} PCC: {test.pcc}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {test.status} - {test.statusText}
                        </p>
                        {test.success && (
                          <p className="text-sm text-green-600">
                            ✅ Token received successfully
                          </p>
                        )}
                        {!test.success && test.error && (
                          <p className="text-sm text-red-600">
                            ❌ {test.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugResult.authTest && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Legacy Authentication Test</h3>
                <div className="flex items-center gap-3 p-3 bg-white rounded border">
                  {renderStatusIcon(debugResult.authTest.success)}
                  <div className="flex-1">
                    <p className="font-medium">Without PCC</p>
                    <p className="text-sm text-gray-600">
                      Status: {debugResult.authTest.status} - {debugResult.authTest.statusText}
                    </p>
                    {!debugResult.authTest.success && debugResult.authTest.error && (
                      <p className="text-sm text-red-600">
                        ❌ {debugResult.authTest.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {debugResult.recommendations && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Recommendations</h3>
                <div className="space-y-2 text-sm">
                  {debugResult.recommendations.workingEnvironments?.length > 0 && (
                    <p className="text-green-700">
                      ✅ Working environments: {debugResult.recommendations.workingEnvironments.join(', ')}
                    </p>
                  )}
                  {debugResult.recommendations.missingCredentials?.length > 0 && (
                    <p className="text-red-700">
                      ❌ Missing credentials: {debugResult.recommendations.missingCredentials.join(', ')}
                    </p>
                  )}
                  {debugResult.recommendations.requiresPCC && (
                    <p className="text-orange-700">
                      ⚠️ PCC codes are required for Sabre authentication
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Test completed at: {new Date(debugResult.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};