import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Users, Crown, Briefcase, Star, Building2, UserCheck } from 'lucide-react';
import { Agent } from '@/hooks/useAgentManagement';
import { MascotAvatar } from '@/components/admin/MascotAvatar';

interface AgentHierarchyProps {
  agents: Agent[];
}

const AgentHierarchyChart: React.FC<AgentHierarchyProps> = ({ agents }) => {
  const getTierIcon = (tierNum: number) => {
    switch (tierNum) {
      case 0: return <Crown className="h-5 w-5 text-amber-500" />;
      case 1: return <Building2 className="h-5 w-5 text-blue-600" />;
      case 2: return <Briefcase className="h-4 w-4 text-emerald-500" />;
      case 3: return <Star className="h-4 w-4 text-purple-500" />;
      default: return <Users className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTierTitle = (tierNum: number, tierName: string) => {
    const tierNameFormatted = tierName.charAt(0).toUpperCase() + tierName.slice(1);
    switch (tierNum) {
      case 0: return `Chief Executive Office`;
      case 1: return `Department Heads`;
      case 2: return `${tierNameFormatted} Managers`;
      case 3: return `${tierNameFormatted} Coordinators`;
      default: return `${tierNameFormatted} Agents`;
    }
  };

  const getTierDescription = (tierNum: number) => {
    switch (tierNum) {
      case 0: return 'Strategic leadership and company-wide governance';
      case 1: return 'Department leadership and strategic oversight';
      case 2: return 'Business operations and workflow management';
      case 3: return 'Specialized coordination and domain expertise';
      default: return 'Task execution and individual user interactions';
    }
  };

  const getDepartmentColor = (department?: string) => {
    switch (department) {
      case 'executive': return 'bg-amber-50 border-amber-200';
      case 'technology': return 'bg-blue-50 border-blue-200';
      case 'finance': return 'bg-green-50 border-green-200';
      case 'marketing': return 'bg-purple-50 border-purple-200';
      case 'operations': return 'bg-orange-50 border-orange-200';
      case 'human_resources': return 'bg-pink-50 border-pink-200';
      case 'customer_service': return 'bg-cyan-50 border-cyan-200';
      case 'analytics': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  // Group agents by department within each tier
  const agentsByDepartment = agents.reduce((acc, agent) => {
    const deptKey = agent.department || 'unassigned';
    if (!acc[deptKey]) acc[deptKey] = {};
    
    const tierKey = `${agent.tier}-${agent.tier_name}`;
    if (!acc[deptKey][tierKey]) acc[deptKey][tierKey] = [];
    acc[deptKey][tierKey].push(agent);
    return acc;
  }, {} as Record<string, Record<string, Agent[]>>);

  // Sort departments by importance
  const departmentOrder = ['executive', 'technology', 'finance', 'marketing', 'operations', 'human_resources', 'customer_service', 'analytics', 'unassigned'];
  const visibleDepartments = departmentOrder.filter(dept => agentsByDepartment[dept]);

  // Get all tiers across departments, sorted by tier number (0, 1, 2, 3, 4)
  const allTiers = new Set<string>();
  Object.values(agentsByDepartment).forEach(deptTiers => {
    Object.keys(deptTiers).forEach(tierKey => allTiers.add(tierKey));
  });
  const tierOrder = Array.from(allTiers).sort((a, b) => {
    const tierA = parseInt(a.split('-')[0]);
    const tierB = parseInt(b.split('-')[0]);
    return tierA - tierB;
  });

  // Check if we have any agents at all
  const totalAgents = agents.length;
  
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
    <div className="space-y-8">
      {tierOrder.map((tierKey) => {
        const tierNum = parseInt(tierKey.split('-')[0]);
        const tierName = tierKey.split('-')[1];
        
        // Get all agents in this tier across all departments
        const tierAgents = visibleDepartments.flatMap(dept => 
          agentsByDepartment[dept][tierKey] || []
        );
        
        if (tierAgents.length === 0) return null;

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
              {/* Group by department for this tier */}
              <div className="space-y-6">
                {visibleDepartments.map((department) => {
                  const deptAgents = agentsByDepartment[department][tierKey] || [];
                  if (deptAgents.length === 0) return null;
                  
                  const departmentHeads = deptAgents.filter(agent => agent.is_department_head);
                  const regularAgents = deptAgents.filter(agent => !agent.is_department_head);

                  return (
                    <div key={department} className={`p-4 rounded-lg border ${getDepartmentColor(department)}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-4 w-4" />
                        <h4 className="font-medium capitalize">
                          {department.replace('_', ' ')} Department
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {deptAgents.length} agents
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Show department heads first */}
                        {departmentHeads.map((agent) => (
                          <div
                            key={agent.id}
                            className="p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <MascotAvatar 
                                category={agent.category} 
                                status={agent.status}
                                healthStatus={agent.health_status} 
                                size="sm" 
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium truncate">{agent.display_name}</h5>
                                  {agent.is_department_head && (
                                    <UserCheck className="h-3 w-3 text-blue-600" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize mb-2">
                                  {agent.category.replace(/_/g, ' ')}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={agent.status === 'active' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {agent.status}
                                  </Badge>
                                  <Badge 
                                    variant={agent.health_status === 'healthy' ? 'outline' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {agent.health_status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {agent.capabilities && agent.capabilities.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Key Capabilities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {agent.capabilities.slice(0, 2).map((capability, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {capability.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                  {agent.capabilities.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{agent.capabilities.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Show regular agents */}
                        {regularAgents.map((agent) => (
                          <div
                            key={agent.id}
                            className="p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <MascotAvatar 
                                category={agent.category} 
                                status={agent.status}
                                healthStatus={agent.health_status} 
                                size="sm" 
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium truncate mb-1">{agent.display_name}</h5>
                                <p className="text-xs text-muted-foreground capitalize mb-2">
                                  {agent.category.replace(/_/g, ' ')}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={agent.status === 'active' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {agent.status}
                                  </Badge>
                                  <Badge 
                                    variant={agent.health_status === 'healthy' ? 'outline' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {agent.health_status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {agent.capabilities && agent.capabilities.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Capabilities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {agent.capabilities.slice(0, 2).map((capability, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {capability.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                  {agent.capabilities.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{agent.capabilities.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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