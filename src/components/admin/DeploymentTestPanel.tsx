import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface TestResult {
  timestamp: string;
  deployment: {
    status: string;
    version?: number;
  };
  database: any;
  providers: any;
  functions: any;
  configurations: any;
}

export const DeploymentTestPanel = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDeploymentTest = async () => {
    setTesting(true);
    setError(null);
    
    try {
      console.log('🧪 Running deployment validator...');
      
      const { data, error: functionError } = await supabase.functions.invoke('deployment-validator');
      
      if (functionError) {
        throw new Error(functionError.message);
      }
      
      setResults(data);
      console.log('✅ Deployment validation complete:', data);
    } catch (err: any) {
      console.error('❌ Deployment test failed:', err);
      setError(err.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'critical':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Deployment Validation
          <Button 
            onClick={runDeploymentTest} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Test'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {results && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(results.deployment.status)}>
                {getStatusIcon(results.deployment.status)}
                <span className="ml-1">{results.deployment.status}</span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(results.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Database</h4>
                <Badge variant="outline" className={getStatusColor(results.database.status)}>
                  {results.database.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Providers</h4>
                <div className="text-sm">
                  <p>Total: {results.providers.total}</p>
                  <p>Hotels: {results.providers.hotel}</p>
                  <p>Enabled: {results.providers.enabled}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Functions</h4>
              <div className="space-y-1">
                {Object.entries(results.functions).map(([name, func]: [string, any]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(func.status)}
                      >
                        {func.status}
                      </Badge>
                      {func.responseTime && (
                        <span className="text-xs text-muted-foreground">
                          {func.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">API Credentials</h4>
              <div className="space-y-1">
                {Object.entries(results.configurations.secrets).map(([name, config]: [string, any]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <Badge 
                      variant="outline" 
                      className={config.configured && config.hasValue ? 'bg-green-500' : 'bg-red-500'}
                    >
                      {config.configured && config.hasValue ? 'OK' : 'Missing'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};