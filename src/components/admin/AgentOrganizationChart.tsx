import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Users, 
  Shield, 
  MessageSquare, 
  Search, 
  MapPin, 
  FileText, 
  BarChart3,
  Workflow,
  Crown
} from 'lucide-react';

interface AgentNode {
  id: string;
  name: string;
  role: string;
  category: string;
  status: 'active' | 'idle' | 'busy';
  reports_to?: string;
  manages?: string[];
  capabilities: string[];
  current_tasks: number;
  icon: React.ReactNode;
}

const agentHierarchy: AgentNode[] = [
  {
    id: 'supervisor-memory-agent',
    name: 'Supervisor Memory Agent',
    role: 'Chief Orchestrator',
    category: 'management',
    status: 'active',
    manages: ['user-support', 'travel-insurance-coordinator', 'visa-assistant'],
    capabilities: ['workflow-orchestration', 'task-delegation', 'memory-management'],
    current_tasks: 5,
    icon: <Crown className="h-4 w-4" />
  },
  {
    id: 'user-support',
    name: 'User Support Agent',
    role: 'Customer Relations Lead',
    category: 'communication',
    status: 'active',
    reports_to: 'supervisor-memory-agent',
    manages: ['fraud-detection'],
    capabilities: ['customer-support', 'issue-resolution', 'escalation-management'],
    current_tasks: 12,
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    id: 'travel-insurance-coordinator',
    name: 'Travel Insurance Coordinator',
    role: 'Insurance Specialist',
    category: 'travel_services',
    status: 'busy',
    reports_to: 'supervisor-memory-agent',
    manages: ['accessibility-coordinator'],
    capabilities: ['insurance-analysis', 'policy-recommendations', 'claims-processing'],
    current_tasks: 8,
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'visa-assistant',
    name: 'Visa Assistant',
    role: 'Documentation Expert',
    category: 'travel_services',
    status: 'active',
    reports_to: 'supervisor-memory-agent',
    capabilities: ['visa-requirements', 'document-verification', 'travel-compliance'],
    current_tasks: 6,
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: 'fraud-detection',
    name: 'Fraud Detection Agent',
    role: 'Security Analyst',
    category: 'security',
    status: 'active',
    reports_to: 'user-support',
    capabilities: ['risk-assessment', 'transaction-monitoring', 'anomaly-detection'],
    current_tasks: 3,
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'adventure-specialist',
    name: 'Adventure Specialist',
    role: 'Activity Planner',
    category: 'travel_services',
    status: 'idle',
    capabilities: ['activity-planning', 'adventure-coordination', 'safety-assessment'],
    current_tasks: 0,
    icon: <MapPin className="h-4 w-4" />
  },
  {
    id: 'activity-finder',
    name: 'Activity Finder',
    role: 'Experience Curator',
    category: 'travel_services',
    status: 'active',
    capabilities: ['activity-search', 'recommendation-engine', 'booking-coordination'],
    current_tasks: 4,
    icon: <Search className="h-4 w-4" />
  },
  {
    id: 'accessibility-coordinator',
    name: 'Accessibility Coordinator',
    role: 'Inclusive Travel Specialist',
    category: 'travel_services',
    status: 'active',
    reports_to: 'travel-insurance-coordinator',
    capabilities: ['accessibility-planning', 'accommodation-verification', 'special-needs'],
    current_tasks: 2,
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'advanced-analytics-processor',
    name: 'Analytics Processor',
    role: 'Data Intelligence Lead',
    category: 'analytics',
    status: 'busy',
    capabilities: ['data-analysis', 'predictive-modeling', 'reporting'],
    current_tasks: 7,
    icon: <BarChart3 className="h-4 w-4" />
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'busy': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'idle': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const AgentCard: React.FC<{ agent: AgentNode; level: number }> = ({ agent, level }) => (
  <Card className={`w-80 transition-all hover:shadow-lg ${level === 0 ? 'ring-2 ring-primary/20' : ''}`}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {agent.icon}
          <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
        </div>
        <Badge variant="outline" className={getStatusColor(agent.status)}>
          {agent.status}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{agent.role}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Active Tasks</span>
        <Badge variant="secondary">{agent.current_tasks}</Badge>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Core Capabilities</p>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 2).map((capability) => (
            <Badge key={capability} variant="outline" className="text-xs">
              {capability}
            </Badge>
          ))}
          {agent.capabilities.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{agent.capabilities.length - 2}
            </Badge>
          )}
        </div>
      </div>

      {agent.manages && agent.manages.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Manages</p>
          <div className="flex flex-wrap gap-1">
            {agent.manages.map((managedId) => {
              const managed = agentHierarchy.find(a => a.id === managedId);
              return managed ? (
                <Badge key={managedId} variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {managed.name.split(' ')[0]}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const renderHierarchyLevel = (agents: AgentNode[], level: number = 0): React.ReactNode => {
  if (agents.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-6">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} level={level} />
        ))}
      </div>
      
      {agents.some(agent => agent.manages && agent.manages.length > 0) && (
        <div className="relative">
          <div className="absolute left-1/2 top-0 w-px h-8 bg-border transform -translate-x-1/2" />
          <div className="mt-8">
            {agents.map((agent) => {
              if (!agent.manages || agent.manages.length === 0) return null;
              
              const managedAgents = agentHierarchy.filter(a => 
                agent.manages?.includes(a.id)
              );
              
              return (
                <div key={`${agent.id}-managed`} className="space-y-8">
                  {renderHierarchyLevel(managedAgents, level + 1)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const AgentOrganizationChart: React.FC = () => {
  // Get top-level agents (those without reports_to)
  const topLevelAgents = agentHierarchy.filter(agent => !agent.reports_to);
  
  // Get independent agents (no hierarchy)
  const independentAgents = agentHierarchy.filter(agent => 
    !agent.reports_to && (!agent.manages || agent.manages.length === 0)
  );

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Workflow className="h-5 w-5" />
          Agent Organization Structure
        </h3>
        <p className="text-sm text-muted-foreground">
          Visual representation of agent hierarchy and working relationships
        </p>
      </div>

      {/* Main Hierarchy */}
      <div className="space-y-8">
        {renderHierarchyLevel(topLevelAgents.filter(agent => agent.manages && agent.manages.length > 0))}
      </div>

      {/* Independent Agents */}
      {independentAgents.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-md font-medium text-muted-foreground">Independent Specialists</h4>
            <div className="w-24 h-px bg-border mx-auto mt-2" />
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {independentAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} level={1} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Busy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span>Idle</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-primary" />
              <span>Chief Orchestrator</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};