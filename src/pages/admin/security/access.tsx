import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiagnosticWrapper } from '@/components/admin/DiagnosticWrapper';

// Lazy load components for better error isolation
const SecuritySettingsGuide = React.lazy(() => 
  import('@/components/admin/SecuritySettingsGuide').then(m => ({ default: m.SecuritySettingsGuide }))
);
const SecurityMonitoring = React.lazy(() => 
  import('@/components/admin/SecurityMonitoring').then(m => ({ default: m.SecurityMonitoring }))
);
const EmergencyStabilization = React.lazy(() => 
  import('@/components/admin/EmergencyStabilization').then(m => ({ default: m.EmergencyStabilization }))
);
const ProviderHealthDashboard = React.lazy(() => 
  import('@/components/admin/ProviderHealthDashboard').then(m => ({ default: m.ProviderHealthDashboard }))
);
const AuthenticationFix = React.lazy(() => 
  import('@/components/admin/AuthenticationFix').then(m => ({ default: m.AuthenticationFix }))
);
const SystemHealthMonitor = React.lazy(() => 
  import('@/components/admin/SystemHealthMonitor').then(m => ({ default: m.SystemHealthMonitor }))
);
const RecoveryStatus = React.lazy(() => 
  import('@/components/admin/RecoveryStatus').then(m => ({ default: m.RecoveryStatus }))
);
const SecurityValidationPanel = React.lazy(() => 
  import('@/components/admin/SecurityValidationPanel').then(m => ({ default: m.SecurityValidationPanel }))
);
const ProviderApiTester = React.lazy(() => 
  import('@/components/admin/ProviderApiTester').then(m => ({ default: m.ProviderApiTester }))
);
const LoadTestingDashboard = React.lazy(() => 
  import('@/components/admin/LoadTestingDashboard').then(m => ({ default: m.LoadTestingDashboard }))
);
const MFAConfiguration = React.lazy(() => 
  import('@/components/admin/MFAConfiguration').then(m => ({ default: m.MFAConfiguration }))
);
const SecurityEventMonitoring = React.lazy(() => 
  import('@/components/admin/SecurityEventMonitoring').then(m => ({ default: m.SecurityEventMonitoring }))
);
const ExecutiveDashboard = React.lazy(() => 
  import('@/components/admin/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard }))
);
const OperationsDashboard = React.lazy(() => 
  import('@/components/admin/OperationsDashboard').then(m => ({ default: m.OperationsDashboard }))
);

const AdminSecurityPage = () => {
  console.log('AdminSecurityPage: Component rendering');
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Operations Control</h1>
        <p className="text-muted-foreground">
          Emergency stabilization, security monitoring, and system operations
        </p>
      </div>
      
      <Tabs defaultValue="executive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="testing">Validation</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="executive">
          <DiagnosticWrapper componentName="ExecutiveDashboard">
            <ExecutiveDashboard />
          </DiagnosticWrapper>
        </TabsContent>

        <TabsContent value="operations">
          <DiagnosticWrapper componentName="OperationsDashboard">
            <OperationsDashboard />
          </DiagnosticWrapper>
        </TabsContent>

        <TabsContent value="recovery">
          <DiagnosticWrapper componentName="RecoveryStatus">
            <RecoveryStatus />
          </DiagnosticWrapper>
        </TabsContent>
        
        <TabsContent value="emergency">
          <DiagnosticWrapper componentName="EmergencyStabilization">
            <EmergencyStabilization />
          </DiagnosticWrapper>
        </TabsContent>
        
        <TabsContent value="auth">
          <DiagnosticWrapper componentName="AuthenticationFix">
            <AuthenticationFix />
          </DiagnosticWrapper>
        </TabsContent>
        
        <TabsContent value="providers">
          <div className="space-y-6">
            <DiagnosticWrapper componentName="ProviderHealthDashboard">
              <ProviderHealthDashboard />
            </DiagnosticWrapper>
            <DiagnosticWrapper componentName="ProviderApiTester">
              <ProviderApiTester />
            </DiagnosticWrapper>
          </div>
        </TabsContent>
        
        <TabsContent value="testing">
          <div className="space-y-6">
            <DiagnosticWrapper componentName="SecurityValidationPanel">
              <SecurityValidationPanel />
            </DiagnosticWrapper>
            <DiagnosticWrapper componentName="LoadTestingDashboard">
              <LoadTestingDashboard />
            </DiagnosticWrapper>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="space-y-6">
            <DiagnosticWrapper componentName="MFAConfiguration">
              <MFAConfiguration />
            </DiagnosticWrapper>
            <DiagnosticWrapper componentName="SecurityEventMonitoring">
              <SecurityEventMonitoring />
            </DiagnosticWrapper>
            <DiagnosticWrapper componentName="SecuritySettingsGuide">
              <SecuritySettingsGuide />
            </DiagnosticWrapper>
          </div>
        </TabsContent>
        
        <TabsContent value="monitoring">
          <div className="space-y-6">
            <DiagnosticWrapper componentName="SystemHealthMonitor">
              <SystemHealthMonitor />
            </DiagnosticWrapper>
            <DiagnosticWrapper componentName="SecurityMonitoring">
              <SecurityMonitoring />
            </DiagnosticWrapper>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurityPage;