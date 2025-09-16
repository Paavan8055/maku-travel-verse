import React from 'react';
import { AgentWorkflowBuilder } from '@/components/admin/agent-management/AgentWorkflowBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, GitBranch, Target } from 'lucide-react';

export default function OrchestrationPage() {
  // Mock agents data for the component
  const mockAgents = [
    { id: '1', name: 'Customer Service Agent', status: 'active', type: 'customer_service' },
    { id: '2', name: 'Booking Manager', status: 'active', type: 'booking' },
    { id: '3', name: 'Analytics Agent', status: 'active', type: 'analytics' },
    { id: '4', name: 'Content Manager', status: 'active', type: 'content' },
  ];

  const handleSaveWorkflow = (workflow: any) => {
    console.log('Saving orchestration workflow:', workflow);
  };

  const handleExecuteWorkflow = (workflow: any) => {
    console.log('Executing orchestration workflow:', workflow);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Orchestration</h1>
          <p className="text-muted-foreground">
            Advanced agent coordination and intelligent task routing
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Orchestrator Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">All synchronized</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Routes</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Active pathways</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.8%</div>
            <p className="text-xs text-muted-foreground">Task completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Tasks pending</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Workflow Builder</CardTitle>
          <CardDescription>
            Design complex workflows that coordinate multiple agents for optimal task execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentWorkflowBuilder 
            agents={mockAgents}
            onSaveWorkflow={handleSaveWorkflow}
            onExecuteWorkflow={handleExecuteWorkflow}
          />
        </CardContent>
      </Card>
    </div>
  );
}