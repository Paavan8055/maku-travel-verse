import React from 'react';
import { EmergencyProviderPanel } from '@/components/admin/EmergencyProviderPanel';
import { ProviderCredentialStatus } from '@/components/admin/ProviderCredentialStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Settings, Shield } from 'lucide-react';

const AdminProvidersSettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Settings</h1>
        <p className="text-muted-foreground">
          Manage API provider configurations, credentials, and emergency recovery
        </p>
      </div>

      <Tabs defaultValue="emergency" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Emergency Recovery
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emergency" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Emergency Provider Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmergencyProviderPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Credential Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderCredentialStatus />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced provider configuration options coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProvidersSettingsPage;