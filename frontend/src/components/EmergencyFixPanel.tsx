import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Play, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useEmergencyFix } from '@/hooks/useEmergencyFix';

export const EmergencyFixPanel = () => {
  const { isRunning, report, runEmergencyFix, testProviderRotation } = useEmergencyFix();
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    const success = await testProviderRotation();
    setIsTesting(false);
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Emergency Provider Rotation Fix
        </CardTitle>
        <CardDescription>
          Critical system repair for provider rotation failures detected in audit
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={runEmergencyFix}
            disabled={isRunning}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running Fix...' : 'Run Emergency Fix'}
          </Button>
          
          <Button
            onClick={handleTest}
            disabled={isTesting || isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isTesting ? 'Testing...' : 'Test System'}
          </Button>
        </div>

        {/* Report Display */}
        {report && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              {report.success ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">
                {report.success ? 'Fix Completed Successfully' : 'Fix Failed'}
              </span>
            </div>

            {report.report?.summary && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Providers</div>
                  <div className="text-2xl font-bold">
                    {report.report.summary.totalProviders}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Working Providers</div>
                  <div className="text-2xl font-bold text-success">
                    {report.report.summary.workingProviders}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Failed Tests</div>
                  <div className="text-2xl font-bold text-destructive">
                    {report.report.summary.failedTests}
                  </div>
                </div>
              </div>
            )}

            {report.report?.testResults && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Test Results:</div>
                {report.report.testResults.map((test, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {test.success ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="capitalize">{test.searchType}</span>
                    {test.provider && (
                      <Badge variant="outline" className="text-xs">
                        {test.provider}
                      </Badge>
                    )}
                    {test.error && (
                      <span className="text-destructive text-xs">
                        {test.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {report.report?.enabledProviders && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Enabled Providers:</div>
                <div className="flex flex-wrap gap-1">
                  {report.report.enabledProviders.map((provider) => (
                    <Badge key={provider} variant="secondary" className="text-xs">
                      {provider}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {report.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                Error: {report.error}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Validates all provider credentials</li>
            <li>Resets quota limits that may be blocking requests</li>
            <li>Re-enables working provider configurations</li>
            <li>Tests each service type (hotels, flights, activities)</li>
            <li>Creates alerts for manual intervention if needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};