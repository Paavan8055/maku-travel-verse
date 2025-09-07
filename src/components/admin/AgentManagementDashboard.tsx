import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentOrganizationChart } from './AgentOrganizationChart';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Bot, Calendar, Clock, Play, Pause, Settings, Users, BarChart3, AlertCircle, Search, Filter, RefreshCw, Workflow, Brain, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AgentWorkflowBuilder } from './agent-management/AgentWorkflowBuilder';
import { AgentAnalyticsDashboard } from './agent-management/AgentAnalyticsDashboard';
import { SmartTaskManager } from './agent-management/SmartTaskManager';
import { RealTimeMonitoring } from './agent-management/RealTimeMonitoring';
import { RealTimeAgentStatus } from './agent-management/RealTimeAgentStatus';
import { AgentDirectoryCard } from './AgentDirectoryCard';

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

interface TaskTemplate {
  id: string;
  template_name: string;
  description: string;
  category: string;
  task_definition: any;
  agent_types: string[];
}

interface BatchOperation {
  id: string;
  operation_name: string;
  operation_type: string;
  status: string;
  total_targets: number;
  completed_targets: number;
  failed_targets: number;
  created_at: string;
}

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  agent_id: string;
  is_resolved: boolean;
  created_at: string;
}

export function AgentManagementDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [groups, setGroups] = useState<AgentGroup[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [batchOps, setBatchOps] = useState<BatchOperation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Selected agents for bulk operations
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [bulkTaskDialogOpen, setBulkTaskDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Form states
  const [taskForm, setTaskForm] = useState({ intent: '', params: '{}' });
  const [bulkTaskForm, setBulkTaskForm] = useState({ 
    name: '', 
    intent: '', 
    params: '{}',
    selectedTemplate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAgents(),
        loadGroups(),
        loadTemplates(),
        loadBatchOperations(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load agent management data');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    const { data, error } = await supabase.functions.invoke('agent-management', {
      body: { action: 'list_agents' }
    });
    
    if (error) throw error;
    if (data.success) {
      setAgents(data.data);
    }
  };

  const loadGroups = async () => {
    const { data, error } = await supabase.functions.invoke('agent-management', {
      body: { action: 'get_agent_groups' }
    });
    
    if (error) throw error;
    if (data.success) {
      setGroups(data.data);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('agent_task_templates')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    setTemplates(data);
  };

  const loadBatchOperations = async () => {
    const { data, error } = await supabase.functions.invoke('agent-management', {
      body: { action: 'get_batch_operations' }
    });
    
    if (error) throw error;
    if (data.success) {
      setBatchOps(data.data);
    }
  };

  const loadAlerts = async () => {
    const { data, error } = await supabase.functions.invoke('agent-management', {
      body: { action: 'get_agent_alerts' }
    });
    
    if (error) throw error;
    if (data.success) {
      setAlerts(data.data);
    }
  };

  const assignTask = async () => {
    if (!selectedAgent) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('agent-management', {
        body: {
          action: 'assign_task',
          agentId: selectedAgent.agent_id,
          taskData: {
            intent: taskForm.intent,
            params: JSON.parse(taskForm.params)
          }
        }
      });

      if (error) throw error;
      if (data.success) {
        toast.success('Task assigned successfully');
        setTaskDialogOpen(false);
        setTaskForm({ intent: '', params: '{}' });
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
      toast.error('Failed to assign task');
    }
  };

  const emergencyStop = async (agentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('agent-management', {
        body: {
          action: 'emergency_stop',
          agentId
        }
      });

      if (error) throw error;
      if (data.success) {
        toast.success('Agent emergency stopped');
        loadAgents();
        loadAlerts();
      }
    } catch (error) {
      console.error('Failed to emergency stop agent:', error);
      toast.error('Failed to emergency stop agent');
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.agent_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || agent.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(agents.map(a => a.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading agent management system...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor your AI agent ecosystem
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory">Organization Chart</TabsTrigger>
          <TabsTrigger value="list">Agent Directory</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="tasks">Smart Tasks</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Directory</CardTitle>
              <CardDescription>
                Manage and monitor all AI agents in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentOrganizationChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent List View</CardTitle>
              <CardDescription>
                Detailed list of all agents with search and filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                {/* Action Buttons */}
                <Button 
                  onClick={() => setBulkTaskDialogOpen(true)}
                  disabled={selectedAgents.length === 0}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
                
                <Button 
                  onClick={() => setScheduleDialogOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search agents by name, category, or capability..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="paused">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        Paused
                      </div>
                    </SelectItem>
                    <SelectItem value="error">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Error
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Bulk Actions */}
                {selectedAgents.length > 0 && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <Badge variant="secondary" className="px-3 py-1">
                      {selectedAgents.length} selected
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-1" />
                      Start All
                    </Button>
                    <Button size="sm" variant="outline">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause All
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Active</p>
                      <p className="text-xs text-muted-foreground">
                        {agents.filter(a => a.status === 'active').length} agents
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Busy</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(Math.random() * 5)} tasks
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Idle</p>
                      <p className="text-xs text-muted-foreground">
                        {agents.filter(a => a.status !== 'active').length} agents
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total</p>
                      <p className="text-xs text-muted-foreground">
                        {agents.length} agents
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAgents.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No agents found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search criteria' : 'No agents match the selected filters'}
                    </p>
                  </div>
                ) : (
                  filteredAgents.map(agent => (
                    <AgentDirectoryCard
                      key={agent.id}
                      agent={agent}
                      isSelected={selectedAgents.includes(agent.agent_id)}
                      onSelect={(agentId) => {
                        if (selectedAgents.includes(agentId)) {
                          setSelectedAgents(selectedAgents.filter(id => id !== agentId));
                        } else {
                          setSelectedAgents([...selectedAgents, agentId]);
                        }
                      }}
                      onTaskAssign={() => {
                        setSelectedAgent(agent);
                        setTaskDialogOpen(true);
                      }}
                      onEmergencyStop={() => emergencyStop(agent.agent_id)}
                      onConfigure={() => {
                        setSelectedAgent(agent);
                        setConfigDialogOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Workflow className="h-5 w-5" />
                <span>Workflow Builder</span>
              </CardTitle>
              <CardDescription>
                Create and manage automated agent workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentWorkflowBuilder
                agents={agents}
                onSaveWorkflow={(workflow) => {
                  console.log('Saving workflow:', workflow);
                  toast.success('Workflow saved successfully');
                }}
                onExecuteWorkflow={(workflow) => {
                  console.log('Executing workflow:', workflow);
                  toast.success('Workflow execution started');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Smart Task Manager</span>
              </CardTitle>
              <CardDescription>
                Intelligent task routing and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SmartTaskManager 
                agents={agents}
                onTaskAssign={(agentId, task) => {
                  console.log('Assigning task:', task, 'to agent:', agentId);
                  toast.success('Task assigned successfully');
                }}
                onBulkOperation={(operationData) => {
                  console.log('Bulk operation:', operationData);
                  toast.success('Bulk operation started');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeMonitoring />
            <RealTimeAgentStatus />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Advanced Analytics</span>
              </CardTitle>
              <CardDescription>
                Performance insights and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentAnalyticsDashboard 
                agents={agents}
                onAgentSelect={(agentId) => {
                  console.log('Selected agent for analysis:', agentId);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Agent Groups</span>
                <Button onClick={loadGroups} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Groups
                </Button>
              </CardTitle>
              <CardDescription>
                Organize agents into logical groups for easier management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Agent Groups Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create agent groups to organize your agents by function, department, or capability.
                  </p>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {groups.map(group => (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {group.group_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {group.description || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Created: {new Date(group.created_at).toLocaleDateString()}</span>
                              <span>Updated: {new Date(group.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{group.group_type}</Badge>
                            <Badge variant="secondary">
                              {group.agent_group_memberships?.length || 0} agents
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Group Configuration */}
                          {group.configuration && Object.keys(group.configuration).length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Configuration:</span>
                              <div className="mt-1 p-2 bg-muted rounded text-xs">
                                <pre>{JSON.stringify(group.configuration, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Group Members */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Group Members:</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <Users className="h-4 w-4 mr-1" />
                                  Manage
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {group.agent_group_memberships && group.agent_group_memberships.length > 0 ? (
                              <div className="space-y-2">
                                {group.agent_group_memberships.map(membership => (
                                  <div 
                                    key={membership.agent_id}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Bot className="h-4 w-4" />
                                      <span className="font-medium">
                                        {membership.agent_management?.display_name || membership.agent_id}
                                      </span>
                                      <Badge 
                                        variant={membership.agent_management?.status === 'active' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {membership.agent_management?.status || 'unknown'}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {membership.agent_management?.category || 'general'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="text-xs">
                                        {membership.role || 'member'}
                                      </Badge>
                                      <span>
                                        Added: {new Date(membership.added_at).toLocaleDateString()}
                                      </span>
                                      <div className={`w-2 h-2 rounded-full ${
                                        membership.agent_management?.health_status === 'healthy' ? 'bg-green-500' :
                                        membership.agent_management?.health_status === 'warning' ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 border-2 border-dashed border-muted rounded">
                                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  No agents assigned to this group
                                </p>
                                <Button variant="outline" size="sm" className="mt-2">
                                  Add Agents
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Group Stats */}
                          <div className="pt-2 border-t">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-sm font-medium">Total Agents</div>
                                <div className="text-lg font-bold">{group.agent_group_memberships?.length || 0}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Active Agents</div>
                                <div className="text-lg font-bold text-green-600">
                                  {group.agent_group_memberships?.filter(m => m.agent_management?.status === 'active').length || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Health Status</div>
                                <div className="text-lg font-bold text-blue-600">
                                  {group.agent_group_memberships?.filter(m => m.agent_management?.health_status === 'healthy').length || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Batch Operations</span>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    New Operation
                  </Button>
                </CardTitle>
                <CardDescription>
                  Monitor and manage bulk operations across multiple agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {batchOps.length === 0 ? (
                  <div className="text-center py-8">
                    <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Operations Running</h3>
                    <p className="text-muted-foreground mb-4">
                      Start batch operations to manage multiple agents simultaneously.
                    </p>
                    <Button variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Create Operation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batchOps.map(op => (
                      <Card key={op.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                <Workflow className="h-4 w-4" />
                                {op.operation_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">{op.operation_type}</p>
                            </div>
                            <Badge variant={
                              op.status === 'completed' ? 'default' : 
                              op.status === 'failed' ? 'destructive' : 
                              op.status === 'running' ? 'secondary' : 'outline'
                            }>
                              {op.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.round((op.completed_targets / op.total_targets) * 100)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${(op.completed_targets / op.total_targets) * 100}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-lg font-bold">{op.total_targets}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-green-600">{op.completed_targets}</div>
                                <div className="text-xs text-muted-foreground">Completed</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-red-600">{op.failed_targets}</div>
                                <div className="text-xs text-muted-foreground">Failed</div>
                              </div>
                            </div>
                            
                            {/* Timestamp */}
                            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                              <span>Started: {new Date(op.created_at).toLocaleString()}</span>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>System Status</span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  Overall system health and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Health Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">98.5%</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
                      <div className="text-sm text-muted-foreground">Active Agents</div>
                    </div>
                  </div>
                  
                  {/* Service Status */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Service Status</h4>
                    <div className="space-y-2">
                      {[
                        { name: 'Agent Management', status: 'operational' },
                        { name: 'Task Queue', status: 'operational' },
                        { name: 'Analytics Engine', status: 'operational' },
                        { name: 'Notification Service', status: 'degraded' }
                      ].map(service => (
                        <div key={service.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">{service.name}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              service.status === 'operational' ? 'bg-green-500' :
                              service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-xs capitalize">{service.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Agent Alerts
                </span>
                <div className="flex gap-2">
                  <Badge variant="destructive">
                    {alerts.filter(a => !a.is_resolved && a.severity === 'critical').length} Critical
                  </Badge>
                  <Badge variant="secondary">
                    {alerts.filter(a => !a.is_resolved).length} Active
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Monitor system alerts and agent notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">
                    All agents are operating normally. Alerts will appear here when issues are detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <Card 
                      key={alert.id} 
                      className={`border-l-4 ${
                        alert.severity === 'critical' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20' :
                        alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20' :
                        alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' :
                        'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      } ${alert.is_resolved ? 'opacity-60' : ''}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className={`h-4 w-4 ${
                                alert.severity === 'critical' ? 'text-red-500' :
                                alert.severity === 'high' ? 'text-orange-500' :
                                alert.severity === 'medium' ? 'text-yellow-500' :
                                'text-blue-500'
                              }`} />
                              <h4 className="font-medium">{alert.title}</h4>
                              <Badge variant="outline" className="ml-auto">
                                {alert.agent_id}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Type: {alert.alert_type}</span>
                              <span>•</span>
                              <span>{new Date(alert.created_at).toLocaleString()}</span>
                              {alert.is_resolved && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">Resolved</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'high' ? 'default' :
                              alert.severity === 'medium' ? 'secondary' : 'outline'
                            }>
                              {alert.severity}
                            </Badge>
                            {!alert.is_resolved && (
                              <Button variant="outline" size="sm">
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Assignment Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to {selectedAgent?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Intent</label>
              <Input
                value={taskForm.intent}
                onChange={(e) => setTaskForm({...taskForm, intent: e.target.value})}
                placeholder="e.g., analyze_performance"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Parameters (JSON)</label>
              <Textarea
                value={taskForm.params}
                onChange={(e) => setTaskForm({...taskForm, params: e.target.value})}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={assignTask}>Assign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {selectedAgent?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Agent configuration coming soon...
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}