import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentManagementDashboard } from '@/components/admin/AgentManagementDashboard';
import { StrategicImplementationDashboard } from '@/components/admin/StrategicImplementationDashboard';
import { ConsolidatedAgentDashboard } from '@/components/admin/ConsolidatedAgentDashboard';
import { SecurityHardeningDashboard } from '@/components/admin/SecurityHardeningDashboard';
import { PerformanceOptimizationDashboard } from '@/components/admin/PerformanceOptimizationDashboard';
import { DatabaseOptimizationDashboard } from '@/components/admin/DatabaseOptimizationDashboard';
import { AgentConsolidationDashboard } from '@/components/admin/AgentConsolidationDashboard';

export default function AgentsPage() {
  return (
    <Tabs defaultValue="week3-progress" className="space-y-4">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="week3-progress">Week 4 Progress</TabsTrigger>
        <TabsTrigger value="consolidated">Consolidated</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="database">Database</TabsTrigger>
        <TabsTrigger value="management">Management</TabsTrigger>
        <TabsTrigger value="strategic">Strategic</TabsTrigger>
      </TabsList>
      
      <TabsContent value="week3-progress">
        <AgentConsolidationDashboard />
      </TabsContent>
      
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
    </Tabs>
  );
}