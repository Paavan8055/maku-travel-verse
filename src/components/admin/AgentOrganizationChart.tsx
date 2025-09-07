import React, { useMemo } from 'react';
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
  Crown,
  Bot,
  Settings,
  Database,
  Phone,
  Calendar,
  TrendingUp,
  Globe,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface Agent {
  id: string;
  agent_id: string;
  display_name: string;
  description: string;
  category: string;
  status: string;
  version: string;
  capabilities: string[];
  health_status: string;
  last_health_check: string;
  configuration: any;
  permissions: any;
  performance_settings: any;
}

interface AgentGroup {
  id: string;
  group_name: string;
  description: string;
  group_type: string;
  configuration: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  agent_group_memberships: Array<{
    agent_id: string;
    role: string;
    added_at: string;
    agent_management: {
      display_name: string;
      status: string;
      category: string;
      health_status: string;
    };
  }>;
}

interface AgentNode {
  id: string;
  agent_id: string;
  name: string;
  role: string;
  category: string;
  status: 'active' | 'idle' | 'busy' | 'paused' | 'error';
  health_status: string;
  capabilities: string[];
  current_tasks: number;
  icon: React.ReactNode;
  group_name?: string;
  group_role?: string;
}

interface AgentOrganizationChartProps {
  agents: Agent[];
  groups: AgentGroup[];
}

const getCategoryIcon = (category: string): React.ReactNode => {
  switch (category.toLowerCase()) {
    case 'travel_services':
      return <MapPin className="h-4 w-4" />;
    case 'communication':
      return <MessageSquare className="h-4 w-4" />;
    case 'analytics':
      return <BarChart3 className="h-4 w-4" />;
    case 'security':
      return <Shield className="h-4 w-4" />;
    case 'management':
      return <Crown className="h-4 w-4" />;
    case 'productivity':
      return <Calendar className="h-4 w-4" />;
    case 'hr':
      return <Users className="h-4 w-4" />;
    case 'marketing':
      return <TrendingUp className="h-4 w-4" />;
    case 'operations':
      return <Settings className="h-4 w-4" />;
    case 'intelligence':
      return <Brain className="h-4 w-4" />;
    case 'content':
      return <FileText className="h-4 w-4" />;
    default:
      return <Bot className="h-4 w-4" />;
  }
};

const getAgentRole = (agentId: string, category: string): string => {
  const roleMap: Record<string, string> = {
    'agent-registration-manager': 'System Administrator',
    'agent-performance-monitor': 'Performance Analyst',
    'supervisor-memory-agent': 'Chief Orchestrator',
    'user-support': 'Customer Relations Lead',
    'travel-insurance-coordinator': 'Insurance Specialist',
    'visa-assistant': 'Documentation Expert',
    'fraud-detection': 'Security Analyst',
    'adventure-specialist': 'Activity Planner',
    'activity-finder': 'Experience Curator',
    'accessibility-coordinator': 'Inclusive Travel Specialist',
    'advanced-analytics-processor': 'Data Intelligence Lead',
    'personalized-content-curator': 'Content Strategist',
    'ai-workplace-assistant': 'Productivity Manager',
    'strategic-implementation-manager': 'Strategy Coordinator'
  };
  
  return roleMap[agentId] || `${category} Specialist`;
};

const getStatusColor = (status: string, healthStatus?: string) => {
  if (healthStatus === 'error' || status === 'error') {
    return 'bg-destructive/10 text-destructive border-destructive/20';
  }
  
  switch (status) {
    case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'busy': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'paused': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'idle': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getHealthIcon = (healthStatus: string) => {
  switch (healthStatus) {
    case 'healthy': return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    case 'error': return <AlertTriangle className="h-3 w-3 text-destructive" />;
    default: return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
};

const AgentCard: React.FC<{ agent: AgentNode; isGroupLead?: boolean }> = ({ agent, isGroupLead = false }) => (
  <Card className={`w-72 transition-all hover:shadow-lg ${isGroupLead ? 'ring-2 ring-primary/20' : ''}`}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {agent.icon}
          <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
          {getHealthIcon(agent.health_status)}
        </div>
        <Badge variant="outline" className={getStatusColor(agent.status, agent.health_status)}>
          {agent.status}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{agent.role}</p>
        {agent.group_name && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {agent.group_name}
            </Badge>
            {agent.group_role && agent.group_role !== 'member' && (
              <Badge variant="outline" className="text-xs">
                {agent.group_role}
              </Badge>
            )}
          </div>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Capabilities</span>
        <Badge variant="secondary">{agent.capabilities.length}</Badge>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Core Skills</p>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <Badge key={capability} variant="outline" className="text-xs">
              {capability}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Agent ID</span>
        <code className="text-xs bg-muted px-1 rounded">{agent.agent_id}</code>
      </div>
    </CardContent>
  </Card>
);

const GroupSection: React.FC<{ 
  groupName: string; 
  agents: AgentNode[]; 
  description?: string;
  groupLead?: AgentNode;
}> = ({ groupName, agents, description, groupLead }) => (
  <div className="space-y-4">
    <div className="text-center">
      <h4 className="text-lg font-semibold flex items-center justify-center gap-2">
        <Users className="h-5 w-5" />
        {groupName}
      </h4>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
      <div className="w-24 h-px bg-border mx-auto mt-2" />
    </div>
    
    {groupLead && (
      <div className="flex justify-center mb-4">
        <AgentCard agent={groupLead} isGroupLead={true} />
      </div>
    )}
    
    <div className="flex flex-wrap justify-center gap-4">
      {agents.filter(a => a.id !== groupLead?.id).map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  </div>
);

export const AgentOrganizationChart: React.FC<AgentOrganizationChartProps> = ({ 
  agents, 
  groups 
}) => {
  const agentNodes = useMemo(() => {
    // Create a map of agent memberships
    const membershipMap = new Map<string, { group_name: string; role: string }>();
    
    groups.forEach(group => {
      group.agent_group_memberships?.forEach(membership => {
        membershipMap.set(membership.agent_id, {
          group_name: group.group_name,
          role: membership.role
        });
      });
    });

    // Transform agents to AgentNode format
    return agents.map(agent => {
      const membership = membershipMap.get(agent.agent_id);
      
      return {
        id: agent.id,
        agent_id: agent.agent_id,
        name: agent.display_name,
        role: getAgentRole(agent.agent_id, agent.category),
        category: agent.category,
        status: agent.status as 'active' | 'idle' | 'busy' | 'paused' | 'error',
        health_status: agent.health_status,
        capabilities: agent.capabilities || [],
        current_tasks: 0, // Would need to fetch from tasks table
        icon: getCategoryIcon(agent.category),
        group_name: membership?.group_name,
        group_role: membership?.role
      };
    });
  }, [agents, groups]);

  // Group agents by their functional groups
  const groupedAgents = useMemo(() => {
    const grouped = new Map<string, AgentNode[]>();
    const ungrouped: AgentNode[] = [];

    agentNodes.forEach(agent => {
      if (agent.group_name) {
        if (!grouped.has(agent.group_name)) {
          grouped.set(agent.group_name, []);
        }
        grouped.get(agent.group_name)!.push(agent);
      } else {
        ungrouped.push(agent);
      }
    });

    return { grouped, ungrouped };
  }, [agentNodes]);

  // Get system-level agents (registration and monitoring)
  const systemAgents = agentNodes.filter(agent => 
    agent.agent_id.includes('registration') || 
    agent.agent_id.includes('performance-monitor') ||
    agent.agent_id.includes('supervisor')
  );

  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Agents Found</h3>
        <p className="text-muted-foreground">
          No agents are currently registered in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Workflow className="h-5 w-5" />
          Complete Agent Organization Structure
        </h3>
        <p className="text-sm text-muted-foreground">
          All {agents.length} agents organized by functional groups and responsibilities
        </p>
      </div>

      {/* System Management Level */}
      {systemAgents.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold flex items-center justify-center gap-2 text-primary">
              <Crown className="h-5 w-5" />
              System Management
            </h4>
            <p className="text-sm text-muted-foreground">Core system orchestration and monitoring</p>
            <div className="w-32 h-px bg-primary/30 mx-auto mt-2" />
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {systemAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isGroupLead={true} />
            ))}
          </div>
        </div>
      )}

      {/* Functional Groups */}
      {Array.from(groupedAgents.grouped.entries()).map(([groupName, groupAgents]) => {
        const groupInfo = groups.find(g => g.group_name === groupName);
        const groupLead = groupAgents.find(agent => agent.group_role === 'lead');
        
        return (
          <GroupSection
            key={groupName}
            groupName={groupName}
            agents={groupAgents}
            description={groupInfo?.description}
            groupLead={groupLead}
          />
        );
      })}

      {/* Independent Specialists */}
      {groupedAgents.ungrouped.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold flex items-center justify-center gap-2">
              <Globe className="h-5 w-5" />
              Independent Specialists
            </h4>
            <p className="text-sm text-muted-foreground">
              Specialized agents working across functional boundaries
            </p>
            <div className="w-32 h-px bg-border mx-auto mt-2" />
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {groupedAgents.ungrouped.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Legend */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-2">
              <h5 className="font-medium">Status</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Busy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Paused</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span>Idle</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">Health</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span>Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <span>Error</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">Hierarchy</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="h-3 w-3 text-primary" />
                  <span>System Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span>Group Lead</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span>Independent</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">Summary</h5>
              <div className="space-y-1 text-muted-foreground">
                <div>Total Agents: {agents.length}</div>
                <div>Active Groups: {groups.length}</div>
                <div>Independent: {groupedAgents.ungrouped.length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};