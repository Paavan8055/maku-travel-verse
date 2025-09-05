import React from 'react';
import { AdminGuard } from '@/features/auth/components/AdminGuard';
import { ProviderSystemTester } from '@/components/debug/ProviderSystemTester';
import { DirectProviderTest } from '@/components/debug/DirectProviderTest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const SystemDiagnosticsPage = () => {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">System Diagnostics</h1>
            <p className="text-muted-foreground mt-2">
              Advanced provider testing and system diagnostics (Admin Only)
            </p>
          </div>

          <Alert className="mb-6">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              This is a secure admin-only interface for system diagnostics and provider testing.
              All activities are logged and monitored.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="provider-testing" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="provider-testing">Provider System Testing</TabsTrigger>
              <TabsTrigger value="direct-testing">Direct Provider Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="provider-testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Provider System Tester
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProviderSystemTester />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="direct-testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Direct Provider Testing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DirectProviderTest />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
};

export default SystemDiagnosticsPage;