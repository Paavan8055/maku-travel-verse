import React from 'react';
import { AgentCoordinationDashboard } from '@/components/agentic/coordination/AgentCoordinationDashboard';
import { UniversalAIProvider } from '@/features/universal-ai/context/UniversalAIContext';

const AgentOrchestrationPage = () => {
  return (
    <UniversalAIProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Orchestration Center</h1>
          <p className="text-muted-foreground">
            Monitor and control multi-agent coordination, workflows, and performance
          </p>
        </div>
        
        <AgentCoordinationDashboard />
      </div>
    </UniversalAIProvider>
  );
};

export default AgentOrchestrationPage;