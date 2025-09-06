import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { AgentDirectoryCard } from './agent-management/AgentDirectoryCard';

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
          <TabsTrigger value="directory">Agent Directory</TabsTrigger>
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
                ))}
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
          <RealTimeMonitoring />
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
              <CardTitle>Agent Groups</CardTitle>
              <CardDescription>
                Organize agents into logical groups for easier management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {groups.map(group => (
                  <Card key={group.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{group.group_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                        <Badge variant="outline">{group.group_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex space-x-2">
                        {group.agent_group_memberships.map(membership => (
                          <Badge key={membership.agent_id} variant="secondary">
                            {membership.agent_management.display_name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Operations</CardTitle>
              <CardDescription>
                Monitor and manage bulk operations across multiple agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batchOps.map(op => (
                  <Card key={op.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{op.operation_name}</h4>
                          <p className="text-sm text-muted-foreground">{op.operation_type}</p>
                        </div>
                        <Badge variant={op.status === 'completed' ? 'default' : 
                                      op.status === 'failed' ? 'destructive' : 'secondary'}>
                          {op.status}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{op.completed_targets}/{op.total_targets}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(op.completed_targets / op.total_targets) * 100}%` }}
                          />
                        </div>
                        {op.failed_targets > 0 && (
                          <p className="text-sm text-red-600 mt-2">
                            {op.failed_targets} failed operations
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Monitor critical events and system notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <Card key={alert.id} className={`border-l-4 ${
                    alert.severity === 'high' ? 'border-l-red-500' :
                    alert.severity === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            alert.severity === 'high' ? 'text-red-500' :
                            alert.severity === 'medium' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`} />
                          <div>
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={alert.severity === 'high' ? 'destructive' : 
                                         alert.severity === 'medium' ? 'secondary' : 'default'}>
                            {alert.severity}
                          </Badge>
                          {!alert.is_resolved && (
                            <Button size="sm" variant="outline">
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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