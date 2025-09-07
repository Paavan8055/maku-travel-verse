import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Users, Crown, Briefcase, Star } from 'lucide-react';
import { Agent } from '@/hooks/useAgentManagement';

interface AgentHierarchyProps {
  agents: Agent[];
}

const AgentHierarchyChart: React.FC<AgentHierarchyProps> = ({ agents }) => {
  const getTierIcon = (tierNum: number) => {
    switch (tierNum) {
      case 1: return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2: return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 3: return <Star className="h-4 w-4 text-purple-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierTitle = (tierNum: number, tierName: string) => {
    const tierNameFormatted = tierName.charAt(0).toUpperCase() + tierName.slice(1);
    return `Tier ${tierNum}: ${tierNameFormatted} Agents`;
  };

  const getTierDescription = (tierNum: number) => {
    switch (tierNum) {
      case 1: return 'Strategic oversight and high-level coordination';
      case 2: return 'Business operations and workflow coordination';
      case 3: return 'Domain expertise and specific business functions';
      default: return 'Specialized tasks and individual user interactions';
    }
  };

  const agentsByTier = agents.reduce((acc, agent) => {
    const tierKey = `${agent.tier}-${agent.tier_name}`;
    if (!acc[tierKey]) acc[tierKey] = [];
    acc[tierKey].push(agent);
    return acc;
  }, {} as Record<string, typeof agents>);

  // Sort tiers by tier number (1, 2, 3, 4)
  const tierOrder = Object.keys(agentsByTier).sort((a, b) => {
    const tierA = parseInt(a.split('-')[0]);
    const tierB = parseInt(b.split('-')[0]);
    return tierA - tierB;
  });

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
      {tierOrder.map((tierKey) => {
        const tierAgents = agentsByTier[tierKey] || [];
        if (tierAgents.length === 0) return null;

        const tierNum = parseInt(tierKey.split('-')[0]);
        const tierName = tierKey.split('-')[1];
        const isLastTier = tierNum === Math.max(...tierOrder.map(t => parseInt(t.split('-')[0])));

        return (
          <Card key={tierKey} className="w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                {getTierIcon(tierNum)}
                <div>
                  <CardTitle className="text-lg">{getTierTitle(tierNum, tierName)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getTierDescription(tierNum)}</p>
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
                      <div className="flex-1">
                        <h4 className="font-medium truncate">{agent.display_name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{agent.category.replace(/_/g, ' ')}</p>
                      </div>
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
              
              {!isLastTier && (
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