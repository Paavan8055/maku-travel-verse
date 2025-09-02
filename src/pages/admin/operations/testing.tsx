import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ABTestDashboard } from '@/components/testing/ABTestingFramework';
import { UnifiedTestSuite } from '@/components/testing/UnifiedTestSuite';
import { ProviderTestPanel } from '@/components/debug/ProviderTestPanel';
import { ProviderRotationTestPanel } from '@/components/debug/ProviderRotationTestPanel';
import { DirectProviderTest } from '@/components/debug/DirectProviderTest';
import HotelBedsMonitoringDashboard from '@/components/admin/HotelBedsMonitoringDashboard';
import { CredentialTestSuite } from '@/components/admin/CredentialTestSuite';
import { FoundationRepairPanel } from '@/components/testing/FoundationRepairPanel';
import { ProviderHealthMonitor } from '@/components/admin/ProviderHealthMonitor';
import { TestTube, Play, BarChart3, Settings, Globe, Shield, Wrench, Activity } from 'lucide-react';

const AdminTestingPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Suite & A/B Testing</h1>
        <p className="text-muted-foreground">
          Unified testing interface with automated scenarios, batch operations, and A/B experiments
        </p>
      </div>

      <Tabs defaultValue="health-monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="health-monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Health Monitor
          </TabsTrigger>
          <TabsTrigger value="foundation" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Foundation
          </TabsTrigger>
          <TabsTrigger value="test-suite" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Test Suite
          </TabsTrigger>
          <TabsTrigger value="provider-tests" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Provider Tests
          </TabsTrigger>
          <TabsTrigger value="direct-tests" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Direct Tests
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            A/B Testing
          </TabsTrigger>
          </TabsList>

          <TabsContent value="health-monitor">
            <ProviderHealthMonitor />
          </TabsContent>

          <TabsContent value="foundation">
            <FoundationRepairPanel />
          </TabsContent>

          <TabsContent value="test-suite">
            <UnifiedTestSuite />
          </TabsContent>

        <TabsContent value="provider-tests">
          <div className="space-y-6">
            <ProviderTestPanel />
            <ProviderRotationTestPanel />
          </div>
        </TabsContent>

        <TabsContent value="direct-tests">
          <DirectProviderTest />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialTestSuite />
        </TabsContent>

        <TabsContent value="monitoring">
          <HotelBedsMonitoringDashboard />
        </TabsContent>

        <TabsContent value="ab-testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                A/B Testing Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ABTestDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTestingPage;