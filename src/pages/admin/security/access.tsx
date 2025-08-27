import React from 'react';
import { SecuritySettingsGuide } from '@/components/admin/SecuritySettingsGuide';
import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring';
import { EmergencyStabilization } from '@/components/admin/EmergencyStabilization';
import { ProviderHealthDashboard } from '@/components/admin/ProviderHealthDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSecurityPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Operations Control</h1>
        <p className="text-muted-foreground">
          Emergency stabilization, security monitoring, and system operations
        </p>
      </div>
      
      <Tabs defaultValue="emergency" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="emergency">
          <EmergencyStabilization />
        </TabsContent>
        
        <TabsContent value="providers">
          <ProviderHealthDashboard />
        </TabsContent>
        
        <TabsContent value="security">
          <SecuritySettingsGuide />
        </TabsContent>
        
        <TabsContent value="monitoring">
          <SecurityMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurityPage;