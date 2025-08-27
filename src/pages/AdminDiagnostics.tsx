import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phase3RecoveryPanel } from "@/components/admin/Phase3RecoveryPanel";
import { CredentialManagementPanel } from "@/components/admin/CredentialManagementPanel";
import { ProviderCredentialStatus } from "@/components/admin/ProviderCredentialStatus";
import { HotelBedsCredentialTest } from "@/components/admin/HotelBedsCredentialTest";
import { ProductionDiagnostics } from "@/components/diagnostics/ProductionDiagnostics";

interface CredentialTestResult {
  provider: string;
  service: string;
  success: boolean;
  message: string;
  details?: any;
}

interface SabreDebugResult {
  success: boolean;
  environment: {
    SABRE_CLIENT_ID: { exists: boolean; length: number; prefix: string };
    SABRE_CLIENT_SECRET: { exists: boolean; length: number; prefix: string };
    SABRE_BASE_URL: { exists: boolean; value: string };
  };
  authTest: {
    success: boolean;
    status?: number;
    statusText?: string;
    hasToken?: boolean;
    error?: string;
  } | null;
}

export default function AdminDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [credentialResults, setCredentialResults] = useState<CredentialTestResult[]>([]);
  const [sabreDebugResults, setSabreDebugResults] = useState<SabreDebugResult | null>(null);
  const { toast } = useToast();

  const testProviderCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-credential-test', {
        body: { services: ['amadeus-flight', 'sabre-flight', 'hotelbeds-hotel', 'hotelbeds-activity'] }
      });

      if (error) throw error;

      setCredentialResults(data.results || []);
      toast({
        title: "Credential Test Complete",
        description: `Tested ${data.results?.length || 0} providers`,
      });
    } catch (error) {
      console.error('Credential test failed:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const debugSabreCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-sabre-credentials');

      if (error) throw error;

      setSabreDebugResults(data);
      toast({
        title: "Sabre Debug Complete",
        description: "Check results below",
      });
    } catch (error) {
      console.error('Sabre debug failed:', error);
      toast({
        title: "Debug Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Success" : "Failed"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Critical Recovery Console
          </h1>
          <p className="text-muted-foreground mt-1">
            Emergency provider recovery and credential management system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testProviderCredentials} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Quick Test
          </Button>
          <Button onClick={debugSabreCredentials} disabled={loading} variant="secondary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
            Debug Sabre
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recovery" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recovery" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recovery
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Shield className="h-4 w-4 mr-2" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="recovery" className="space-y-6 mt-6">
          <Phase3RecoveryPanel />
          <ProductionDiagnostics />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6 mt-6">
          <CredentialManagementPanel />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProviderCredentialStatus />
            <HotelBedsCredentialTest />
          </div>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6 mt-6">
          <ProductionDiagnostics />
          <ProviderCredentialStatus />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6 mt-6">

          {/* Legacy Provider Credential Results */}
          {credentialResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Legacy Credential Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {credentialResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.success)}
                        <div>
                          <div className="font-medium">{result.provider} - {result.service}</div>
                          <div className="text-sm text-muted-foreground">{result.message}</div>
                        </div>
                      </div>
                      {getStatusBadge(result.success)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legacy Sabre Debug Results */}
          {sabreDebugResults && (
            <Card>
              <CardHeader>
                <CardTitle>Legacy Sabre Debug Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Environment Variables</h3>
                  <div className="space-y-2">
                    {Object.entries(sabreDebugResults.environment).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-mono text-sm">{key}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(value.exists)}
                          <span className="text-sm">
                            {value.exists ? 
                              ('length' in value ? `Length: ${value.length}, Prefix: ${value.prefix}` : `Value: ${value.value}`) 
                              : 'Not found'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {sabreDebugResults.authTest && (
                  <div>
                    <h3 className="font-semibold mb-2">Authentication Test</h3>
                    <div className="p-3 bg-muted rounded">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(sabreDebugResults.authTest.success)}
                        {getStatusBadge(sabreDebugResults.authTest.success)}
                      </div>
                      {sabreDebugResults.authTest.status && (
                        <div className="text-sm">
                          Status: {sabreDebugResults.authTest.status} {sabreDebugResults.authTest.statusText}
                        </div>
                      )}
                      {sabreDebugResults.authTest.hasToken && (
                        <div className="text-sm text-green-600">✓ Access token received</div>
                      )}
                      {sabreDebugResults.authTest.error && (
                        <div className="text-sm text-red-600">Error: {sabreDebugResults.authTest.error}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}