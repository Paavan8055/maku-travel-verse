import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Save, Trash2, Copy, Settings, ChevronDown, ChevronRight, RefreshCw, Search, Filter, Plus, Workflow } from 'lucide-react';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AgentNodeData {
  agentId: string;
  agentName: string;
  status: 'idle' | 'running' | 'error' | 'success';
  config: any;
  performance: {
    successRate: number;
    avgResponseTime: number;
  };
}

interface WorkflowTemplate {
  id: string;
  workflow_name: string;
  description: string;
  trigger_conditions: any;
  agent_sequence: any;
  workflow_config: any;
  is_active: boolean;
  execution_count: number;
  success_rate: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const AgentNode = ({ data }: { data: AgentNodeData }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-card border-2 border-border rounded-lg p-4 min-w-[200px] shadow-lg relative">
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center justify-between mb-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`} />
        <Badge variant="secondary" className="text-xs">
          {data.performance.successRate}%
        </Badge>
      </div>
      
      <h3 className="font-semibold text-sm mb-1">{data.agentName}</h3>
      <p className="text-xs text-muted-foreground mb-2">{data.agentId}</p>
      
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Response:</span>
          <span>{data.performance.avgResponseTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="capitalize">{data.status}</span>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const ConditionalNode = ({ data }: { data: any }) => (
  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 min-w-[150px] relative">
    <Handle type="target" position={Position.Left} />
    
    <div className="text-center">
      <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
        <span className="text-white text-xs">?</span>
      </div>
      <h3 className="font-semibold text-sm">Condition</h3>
      <p className="text-xs text-gray-600">{data.condition || 'If/Then/Else'}</p>
    </div>
    
    <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }} />
    <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} />
  </div>
);

const TriggerNode = ({ data }: { data: any }) => (
  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 min-w-[150px] relative">
    <div className="text-center">
      <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
        <Play className="w-4 h-4 text-white" />
      </div>
      <h3 className="font-semibold text-sm">Trigger</h3>
      <p className="text-xs text-gray-600">{data.trigger || 'Workflow Start'}</p>
    </div>
    
    <Handle type="source" position={Position.Right} />
  </div>
);

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  conditional: ConditionalNode,
  trigger: TriggerNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { trigger: 'User Request' },
  },
];

const initialEdges: Edge[] = [];

// Enhanced workflow categories
const WORKFLOW_CATEGORIES = [
  'customer_journey',
  'operations', 
  'support_quality',
  'marketing',
  'analytics',
  'compliance'
];

const CATEGORY_LABELS = {
  customer_journey: 'Customer Journey',
  operations: 'Operations',
  support_quality: 'Support & Quality',
  marketing: 'Marketing',
  analytics: 'Analytics',
  compliance: 'Compliance'
};

interface AgentWorkflowBuilderProps {
  agents: any[];
  onSaveWorkflow: (workflow: any) => void;
  onExecuteWorkflow: (workflow: any) => void;
}

export const AgentWorkflowBuilder: React.FC<AgentWorkflowBuilderProps> = ({
  agents,
  onSaveWorkflow,
  onExecuteWorkflow,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [agentsExpanded, setAgentsExpanded] = useState(true);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load templates from database
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orchestration_workflows')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load workflow templates:', error);
      toast.error('Failed to load workflow templates');
      // Create some mock templates for now
      setTemplates([
        {
          id: '1',
          workflow_name: 'Customer Onboarding',
          description: 'Complete customer onboarding process',
          trigger_conditions: {},
          agent_sequence: {
            nodes: [
              { id: '1', type: 'trigger', position: { x: 100, y: 100 }, data: { trigger: 'New Customer' } },
              { id: '2', type: 'agent', position: { x: 300, y: 100 }, data: { agentName: 'Welcome Agent', agentId: 'welcome-agent', status: 'idle', performance: { successRate: 95, avgResponseTime: 150 } } }
            ],
            edges: [{ id: 'e1-2', source: '1', target: '2' }]
          },
          workflow_config: {},
          is_active: true,
          execution_count: 0,
          success_rate: 0,
          created_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addAgentNode = (agent: any) => {
    const newNode: Node = {
      id: `agent-${Date.now()}`,
      type: 'agent',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 200 },
      data: {
        agentId: agent.agent_id,
        agentName: agent.display_name,
        status: 'idle',
        config: agent.configuration,
        performance: {
          successRate: Math.round(Math.random() * 20 + 80),
          avgResponseTime: Math.round(Math.random() * 200 + 100)
        }
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addConditionalNode = () => {
    const newNode: Node = {
      id: `conditional-${Date.now()}`,
      type: 'conditional',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 300 },
      data: { condition: 'New Condition' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      try {
        // Get workflow data from either workflow_config or agent_sequence
        const workflowData = template.workflow_config || template.agent_sequence;
        
        if (workflowData && workflowData.nodes) {
          // Clear existing workflow first
          setNodes([]);
          setEdges([]);
          
          // Load template data with a small delay to ensure proper rendering
          setTimeout(() => {
            setNodes(workflowData.nodes || []);
            setEdges(workflowData.edges || []);
          }, 100);
          
          setSelectedTemplate(templateId);
          setWorkflowName(template.workflow_name);
          setWorkflowDescription(template.description);
          toast.success(`Template "${template.workflow_name}" loaded. You can now edit and save changes.`);
        } else {
          toast.error('Template data is invalid or missing');
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast.error('Failed to load template');
      }
    }
  };

  const saveAsTemplate = async () => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    try {
      // Convert nodes and edges to JSON-serializable format
      const serializableNodes = nodes.map(node => ({
        ...node,
        position: { x: node.position.x, y: node.position.y },
        selected: undefined,
        dragging: undefined
      }));

      const workflowData = { nodes: serializableNodes, edges };

      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('orchestration_workflows')
          .update({
            workflow_name: workflowName,
            description: workflowDescription,
            workflow_config: JSON.parse(JSON.stringify(workflowData)),
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase
          .from('orchestration_workflows')
          .insert({
            workflow_name: workflowName,
            description: workflowDescription,
            workflow_config: JSON.parse(JSON.stringify(workflowData)),
            agent_sequence: {},
            trigger_conditions: {}
          });

        if (error) throw error;
        toast.success('Workflow saved as new template');
      }
      
      loadTemplates();
      setIsDialogOpen(false);
      // Clear selection after saving
      setSelectedTemplate('');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      setIsDialogOpen(true);
      return;
    }

    const workflow = {
      nodes,
      edges,
      name: workflowName,
      description: workflowDescription,
      created: new Date().toISOString(),
    };
    onSaveWorkflow(workflow);
    toast.success('Workflow saved successfully');
  };

  const handleExecuteWorkflow = () => {
    const workflow = { nodes, edges };
    onExecuteWorkflow(workflow);
    toast.success('Workflow execution started');
  };

  // Filter templates based on search
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.workflow_name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                         template.description.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="templates">Template Library</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <div className="grid grid-cols-4 gap-6 h-[800px]">
            {/* Workflow Canvas */}
            <div className="col-span-3">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Workflow Builder</CardTitle>
                  <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {selectedTemplate ? 'Update Template' : 'Save Workflow'}
                          </DialogTitle>
                          <DialogDescription>
                            {selectedTemplate 
                              ? 'Update the existing template with your changes.'
                              : 'Save your workflow for future use or as a template.'
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Workflow Name</Label>
                            <Input
                              id="name"
                              value={workflowName}
                              onChange={(e) => setWorkflowName(e.target.value)}
                              placeholder="Enter workflow name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={workflowDescription}
                              onChange={(e) => setWorkflowDescription(e.target.value)}
                              placeholder="Describe your workflow"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSaveWorkflow} variant="outline">Save Workflow</Button>
                          <Button onClick={saveAsTemplate}>
                            {selectedTemplate ? 'Update Template' : 'Save as Template'}
                          </Button>
                          {selectedTemplate && (
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedTemplate('');
                                setWorkflowName('');
                                setWorkflowDescription('');
                                setIsDialogOpen(false);
                              }}
                            >
                              Save as New
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" onClick={handleExecuteWorkflow}>
                      <Play className="w-4 h-4 mr-2" />
                      Execute
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-full">
                  <div className="h-[700px]">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      nodeTypes={nodeTypes}
                      fitView
                      className="bg-background"
                    >
                      <Background />
                      <Controls />
                      <MiniMap />
                    </ReactFlow>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Palette */}
            <div className="col-span-1 space-y-4">
              <Card>
                <Collapsible open={agentsExpanded} onOpenChange={setAgentsExpanded}>
                  <CardHeader className="pb-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                        <CardTitle className="text-sm">Available Agents</CardTitle>
                        {agentsExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-2 pt-0">
                      {agents.map((agent) => (
                        <Button
                          key={agent.agent_id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-auto p-3"
                          onClick={() => addAgentNode(agent)}
                        >
                          <div className="text-left">
                            <div className="font-medium text-xs">{agent.display_name}</div>
                            <div className="text-xs text-muted-foreground">{agent.category}</div>
                          </div>
                        </Button>
                      ))}
                      
                      <Separator className="my-3" />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={addConditionalNode}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Add Condition
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* Template Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setNodes([])} variant="outline" size="sm">
              Clear Canvas
            </Button>
            <Button onClick={loadTemplates} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading templates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => loadTemplate(template.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.workflow_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {template.success_rate}% Success
                        </Badge>
                        {selectedTemplate === template.id && (
                          <Badge variant="default" className="bg-primary">
                            Loaded
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{template.workflow_config?.nodes?.length || template.agent_sequence?.nodes?.length || 0} nodes</span>
                      <span>{template.execution_count} executions</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="mt-3 text-xs text-primary font-medium">
                        ✓ Template loaded in builder - Make changes and save to update
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {filteredTemplates.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {templateSearch
                    ? 'No templates match your search' 
                    : 'No templates available'
                  }
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights for your agent workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Total Workflows</h4>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Active Templates</h4>
                  <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Total Executions</h4>
                  <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.execution_count, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};