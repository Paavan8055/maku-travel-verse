import React from 'react';
import { SecuritySettingsGuide } from '@/components/admin/SecuritySettingsGuide';
import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring';
import { EmergencyStabilization } from '@/components/admin/EmergencyStabilization';
import { ProviderHealthDashboard } from '@/components/admin/ProviderHealthDashboard';
import { AuthenticationFix } from '@/components/admin/AuthenticationFix';
import { SystemHealthMonitor } from '@/components/admin/SystemHealthMonitor';
import { RecoveryStatus } from '@/components/admin/RecoveryStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityValidationPanel } from '@/components/admin/SecurityValidationPanel';
import { ProviderApiTester } from '@/components/admin/ProviderApiTester';
import { LoadTestingDashboard } from '@/components/admin/LoadTestingDashboard';

const AdminSecurityPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Operations Control</h1>
        <p className="text-muted-foreground">
          Emergency stabilization, security monitoring, and system operations
        </p>
      </div>
      
      <Tabs defaultValue="recovery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="recovery">Recovery Status</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="testing">Validation</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recovery">
          <RecoveryStatus />
        </TabsContent>
        
        <TabsContent value="emergency">
          <EmergencyStabilization />
        </TabsContent>
        
        <TabsContent value="auth">
          <AuthenticationFix />
        </TabsContent>
        
        <TabsContent value="providers">
          <div className="space-y-6">
            <ProviderHealthDashboard />
            <ProviderApiTester />
          </div>
        </TabsContent>
        
        <TabsContent value="testing">
          <div className="space-y-6">
            <SecurityValidationPanel />
            <LoadTestingDashboard />
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <SecuritySettingsGuide />
        </TabsContent>
        
        <TabsContent value="monitoring">
          <div className="space-y-6">
            <SystemHealthMonitor />
            <SecurityMonitoring />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurityPage;