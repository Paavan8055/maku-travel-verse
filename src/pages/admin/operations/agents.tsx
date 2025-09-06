import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentManagementDashboard } from '@/components/admin/AgentManagementDashboard';
import { StrategicImplementationDashboard } from '@/components/admin/StrategicImplementationDashboard';

export default function AgentsPage() {
  return (
    <Tabs defaultValue="management" className="space-y-4">
      <TabsList>
        <TabsTrigger value="management">Agent Management</TabsTrigger>
        <TabsTrigger value="strategic">Strategic Implementation</TabsTrigger>
      </TabsList>
      
      <TabsContent value="management">
        <AgentManagementDashboard />
      </TabsContent>
      
      <TabsContent value="strategic">
        <StrategicImplementationDashboard />
      </TabsContent>
    </Tabs>
  );
}