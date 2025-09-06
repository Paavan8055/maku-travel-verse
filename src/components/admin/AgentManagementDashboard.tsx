import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Bot, Calendar, Clock, Play, Pause, Settings, Users, BarChart3, AlertCircle, Search, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  agent_group_memberships: Array<{
    agent_id: string;
    agent_management: {
      display_name: string;
      status: string;
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
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    scheduleType: 'once',
    scheduleConfig: '{}',
    nextExecution: ''
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

  const bulkAssignTask = async () => {
    if (selectedAgents.length === 0) {
      toast.error('Please select at least one agent');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('agent-management', {
        body: {
          action: 'bulk_assign_task',
          batchData: {
            name: bulkTaskForm.name,
            agentIds: selectedAgents,
            taskConfig: {
              intent: bulkTaskForm.intent,
              params: JSON.parse(bulkTaskForm.params)
            }
          }
        }
      });

      if (error) throw error;
      if (data.success) {
        toast.success(`Bulk task assigned to ${data.data.completed} agents`);
        setBulkTaskDialogOpen(false);
        setBulkTaskForm({ name: '', intent: '', params: '{}', selectedTemplate: '' });
        setSelectedAgents([]);
        loadBatchOperations();
      }
    } catch (error) {
      console.error('Failed to bulk assign task:', error);
      toast.error('Failed to bulk assign task');
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

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setBulkTaskForm({
        ...bulkTaskForm,
        intent: template.task_definition.intent,
        params: JSON.stringify(template.task_definition.params || {}, null, 2),
        selectedTemplate: templateId
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

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
          <Dialog open={bulkTaskDialogOpen} onOpenChange={setBulkTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Bulk Operations
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Task Assignment</DialogTitle>
                <DialogDescription>
                  Assign tasks to multiple agents simultaneously
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Selected Agents ({selectedAgents.length})</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAgents.length > 0 ? `${selectedAgents.length} agents selected` : 'No agents selected'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Task Template</label>
                  <Select value={bulkTaskForm.selectedTemplate} onValueChange={applyTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.template_name} - {template.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Operation Name</label>
                  <Input
                    value={bulkTaskForm.name}
                    onChange={(e) => setBulkTaskForm({...bulkTaskForm, name: e.target.value})}
                    placeholder="e.g., Daily Health Check"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Task Intent</label>
                  <Input
                    value={bulkTaskForm.intent}
                    onChange={(e) => setBulkTaskForm({...bulkTaskForm, intent: e.target.value})}
                    placeholder="e.g., system_health_check"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Parameters (JSON)</label>
                  <Textarea
                    value={bulkTaskForm.params}
                    onChange={(e) => setBulkTaskForm({...bulkTaskForm, params: e.target.value})}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkTaskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={bulkAssignTask}>
                  Assign to {selectedAgents.length} Agents
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory">Agent Directory</TabsTrigger>
          <TabsTrigger value="groups">Agent Groups</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="operations">Batch Operations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgents.map(agent => (
                  <Card key={agent.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedAgents.includes(agent.agent_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAgents([...selectedAgents, agent.agent_id]);
                              } else {
                                setSelectedAgents(selectedAgents.filter(id => id !== agent.agent_id));
                              }
                            }}
                            className="rounded"
                          />
                          <Bot className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-base">{agent.display_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{agent.agent_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                          <Badge variant="outline">{agent.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        {agent.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Health:</span>
                          <span className={getHealthColor(agent.health_status)}>
                            {agent.health_status}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Version:</span>
                          <span>{agent.version}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Dialog open={taskDialogOpen && selectedAgent?.id === agent.id} 
                               onOpenChange={setTaskDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedAgent(agent)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Task
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Task to {agent.display_name}</DialogTitle>
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
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setConfigDialogOpen(true);
                          }}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Config
                        </Button>
                        
                        {agent.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => emergencyStop(agent.agent_id)}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{group.group_name}</span>
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <Badge variant="outline">{group.group_type}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Members:</span>
                      <span>{group.agent_group_memberships?.length || 0}</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    {group.agent_group_memberships?.slice(0, 3).map((membership, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        • {membership.agent_management?.display_name}
                      </div>
                    ))}
                    {(group.agent_group_memberships?.length || 0) > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {group.agent_group_memberships.length - 3} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Operations</CardTitle>
              <CardDescription>
                Track bulk operations and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batchOps.map(operation => (
                  <div key={operation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{operation.operation_name}</h4>
                        <p className="text-sm text-muted-foreground">{operation.operation_type}</p>
                      </div>
                      <Badge variant={operation.status === 'completed' ? 'default' : operation.status === 'running' ? 'secondary' : 'destructive'}>
                        {operation.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span>Total: {operation.total_targets}</span>
                      <span className="text-green-600">Completed: {operation.completed_targets}</span>
                      <span className="text-red-600">Failed: {operation.failed_targets}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Created: {new Date(operation.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Alerts</CardTitle>
              <CardDescription>
                Monitor agent issues and system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${alert.severity === 'high' ? 'border-red-200 bg-red-50' : alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className={`h-4 w-4 ${alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                        <h4 className="font-medium">{alert.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{alert.severity}</Badge>
                        {alert.is_resolved && <Badge variant="default">Resolved</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Agent: {alert.agent_id}</span>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {agents.filter(a => a.status === 'active').length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Agent Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groups.length}</div>
                <p className="text-xs text-muted-foreground">
                  Functional groups
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.filter(a => !a.is_resolved).length}</div>
                <p className="text-xs text-muted-foreground">
                  {alerts.filter(a => !a.is_resolved && a.severity === 'high').length} high priority
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Batch Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{batchOps.filter(op => op.status === 'running').length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}