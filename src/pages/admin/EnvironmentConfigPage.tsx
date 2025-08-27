
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useEnvironmentConfig } from '@/hooks/useEnvironmentConfig';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Server, 
  Shield,
  Database,
  Zap
} from 'lucide-react';

export default function EnvironmentConfigPage() {
  const { config, loading, switchEnvironment, validateProductionReadiness, refresh } = useEnvironmentConfig();
  const [switching, setSwitching] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEnvironmentSwitch = async (toProduction: boolean) => {
    if (toProduction) {
      const confirmed = window.confirm(
        'WARNING: Switching to production will use live endpoints and process real transactions. Are you sure?'
      );
      if (!confirmed) return;
    }

    setSwitching(true);
    try {
      await switchEnvironment(toProduction);
      toast({
        title: "Environment Switched",
        description: `Successfully switched to ${toProduction ? 'production' : 'test'} environment`,
      });
    } catch (error) {
      toast({
        title: "Switch Failed",
        description: "Failed to switch environment",
        variant: "destructive"
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleValidateProduction = async () => {
    setValidating(true);
    try {
      const result = await validateProductionReadiness();
      setValidationResult(result);
      
      if (result.ready) {
        toast({
          title: "Production Ready",
          description: "All systems are ready for production deployment",
        });
      } else {
        toast({
          title: "Production Issues Found",
          description: `Found ${result.issues?.length || 0} issues that need attention`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Failed to validate production readiness",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Environment Configuration</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Environment Configuration</h2>
          <p className="text-muted-foreground">
            Manage test and production environment settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleValidateProduction} 
            variant="outline" 
            size="sm"
            disabled={validating}
          >
            <Shield className="h-4 w-4 mr-2" />
            Validate Production
          </Button>
        </div>
      </div>

      {/* Current Environment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Current Environment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={config?.isProduction ? 'destructive' : 'default'}
                className="px-3 py-1"
              >
                {config?.isProduction ? 'PRODUCTION' : 'TEST'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {config?.isProduction 
                  ? 'Live environment - real transactions' 
                  : 'Test environment - safe for development'
                }
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleEnvironmentSwitch(false)}
                disabled={switching || !config?.isProduction}
                variant="outline"
                size="sm"
              >
                Switch to Test
              </Button>
              <Button
                onClick={() => handleEnvironmentSwitch(true)}
                disabled={switching || config?.isProduction}
                variant="outline"
                size="sm"
              >
                Switch to Production
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Configurations */}
      {config && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Amadeus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Amadeus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Base URL:</strong><br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {config.amadeus?.baseUrl}
                </code>
              </div>
              <div className="text-sm">
                <strong>Token URL:</strong><br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {config.amadeus?.tokenUrl}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Sabre */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sabre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Base URL:</strong><br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {config.sabre?.baseUrl}
                </code>
              </div>
              <div className="text-sm">
                <strong>Token URL:</strong><br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {config.sabre?.tokenUrl}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* HotelBeds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                HotelBeds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Hotel API:</strong><br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {config.hotelbeds?.hotel?.baseUrl}
                </code>
              </div>
              <div className="text-sm">
                <strong>Activity API:</strong><br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {config.hotelbeds?.activity?.baseUrl}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* MTLS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security (MTLS)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={config.mtls?.rejectUnauthorized ? 'default' : 'secondary'}>
                  {config.mtls?.rejectUnauthorized ? 'Strict SSL' : 'Relaxed SSL'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Timeout: {config.mtls?.timeout}ms | Retries: {config.mtls?.retries}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Production Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.ready ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              Production Readiness Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.ready ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All systems are ready for production deployment
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Issues found that need attention before production deployment
                  </AlertDescription>
                </Alert>
                {validationResult.issues?.map((issue: string, index: number) => (
                  <div key={index} className="text-sm text-destructive">
                    • {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!config && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Failed to load environment configuration
            </p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
