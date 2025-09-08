import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentManagementDashboard } from '@/components/admin/AgentManagementDashboard';
import { StrategicImplementationDashboard } from '@/components/admin/StrategicImplementationDashboard';
import { GPTBotIntegrationDashboard } from '@/components/admin/GPTBotIntegrationDashboard';
import { ConsolidatedAgentDashboard } from '@/components/admin/ConsolidatedAgentDashboard';
import { SecurityHardeningDashboard } from '@/components/admin/SecurityHardeningDashboard';
import { PerformanceOptimizationDashboard } from '@/components/admin/PerformanceOptimizationDashboard';
import { DatabaseOptimizationDashboard } from '@/components/admin/DatabaseOptimizationDashboard';

export default function AgentsPage() {
  return (
    <Tabs defaultValue="consolidated" className="space-y-4">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="consolidated">Consolidated</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="database">Database</TabsTrigger>
        <TabsTrigger value="management">Management</TabsTrigger>
        <TabsTrigger value="strategic">Strategic</TabsTrigger>
        <TabsTrigger value="gpt-bots">GPT Bots</TabsTrigger>
      </TabsList>
      
      <TabsContent value="consolidated">
        <ConsolidatedAgentDashboard />
      </TabsContent>
      
      <TabsContent value="security">
        <SecurityHardeningDashboard />
      </TabsContent>
      
      <TabsContent value="performance">
        <PerformanceOptimizationDashboard />
      </TabsContent>
      
      <TabsContent value="database">
        <DatabaseOptimizationDashboard />
      </TabsContent>
      
      <TabsContent value="management">
        <AgentManagementDashboard />
      </TabsContent>
      
      <TabsContent value="strategic">
        <StrategicImplementationDashboard />
      </TabsContent>
      
      <TabsContent value="gpt-bots">
        <GPTBotIntegrationDashboard />
      </TabsContent>
    </Tabs>
  );
}