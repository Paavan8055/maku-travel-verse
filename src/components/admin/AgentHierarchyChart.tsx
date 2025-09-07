import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Users, Crown, Briefcase, Star } from 'lucide-react';

interface AgentHierarchyProps {
  agents: Array<{
    id: string;
    display_name: string;
    category: string;
    status: string;
    capabilities: string[];
  }>;
}

const AgentHierarchyChart: React.FC<AgentHierarchyProps> = ({ agents }) => {
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'executive': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'operational': return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'specialist': return <Star className="h-4 w-4 text-purple-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierTitle = (tier: string) => {
    switch (tier) {
      case 'executive': return 'Tier 1: Executive Managers';
      case 'operational': return 'Tier 2: Operational Managers';
      case 'specialist': return 'Tier 3: Specialist Managers';
      default: return 'Tier 4: Support Agents';
    }
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case 'executive': return 'Strategic oversight and high-level coordination';
      case 'operational': return 'Business operations and workflow coordination';
      case 'specialist': return 'Domain expertise and specific business functions';
      default: return 'Specialized tasks and individual user interactions';
    }
  };

  const agentsByTier = agents.reduce((acc, agent) => {
    const tier = agent.category;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(agent);
    return acc;
  }, {} as Record<string, typeof agents>);

  const tierOrder = ['executive', 'operational', 'specialist', 'customer', 'admin', 'monitoring'];

  // Check if we have any agents at all
  const totalAgents = Object.values(agentsByTier).flat().length;
  
  if (totalAgents === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Agents Found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No AI agents are currently configured in your system. Add agents to see the organizational hierarchy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tierOrder.map((tier) => {
        const tierAgents = agentsByTier[tier] || [];
        if (tierAgents.length === 0) return null;

        return (
          <Card key={tier} className="w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                {getTierIcon(tier)}
                <div>
                  <CardTitle className="text-lg">{getTierTitle(tier)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getTierDescription(tier)}</p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {tierAgents.length} agents
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tierAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate">{agent.display_name}</h4>
                      <Badge 
                        variant={agent.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Capabilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((capability, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {capability.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.capabilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {tier !== 'monitoring' && (
                <div className="flex justify-center mt-6">
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AgentHierarchyChart;