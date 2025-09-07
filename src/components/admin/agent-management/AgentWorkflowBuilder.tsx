import React, { useState, useCallback, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Play, Save, Trash2, Copy, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import 'reactflow/dist/style.css';

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
  {
    id: '2',
    type: 'agent',
    position: { x: 300, y: 100 },
    data: {
      agentId: 'task-router',
      agentName: 'Task Router',
      status: 'idle',
      config: {},
      performance: { successRate: 95, avgResponseTime: 120 }
    },
  },
  {
    id: '3',
    type: 'conditional',
    position: { x: 500, y: 100 },
    data: { condition: 'Task Type?' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [agentsExpanded, setAgentsExpanded] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const templates = useMemo(() => [
    {
      id: 'customer-onboarding',
      name: 'Customer Onboarding',
      description: 'Complete new customer setup workflow',
      nodes: 4,
      estimatedTime: '5-10 minutes'
    },
    {
      id: 'booking-process',
      name: 'Booking Process',
      description: 'End-to-end booking with validation',
      nodes: 6,
      estimatedTime: '2-5 minutes'
    },
    {
      id: 'support-escalation',
      name: 'Support Escalation',
      description: 'Automated support ticket routing',
      nodes: 5,
      estimatedTime: '1-3 minutes'
    },
  ], []);

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

  const handleSaveWorkflow = () => {
    const workflow = {
      nodes,
      edges,
      name: `Workflow-${Date.now()}`,
      created: new Date().toISOString(),
    };
    onSaveWorkflow(workflow);
  };

  const handleExecuteWorkflow = () => {
    const workflow = { nodes, edges };
    onExecuteWorkflow(workflow);
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Clear current workflow
    setNodes([]);
    setEdges([]);

    // Create template-specific workflow based on template type
    let templateNodes: Node[] = [];
    let templateEdges: Edge[] = [];

    switch (templateId) {
      case 'customer-onboarding':
        templateNodes = [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 50, y: 100 },
            data: { trigger: 'New Customer Registration' },
          },
          {
            id: 'validate',
            type: 'agent',
            position: { x: 250, y: 100 },
            data: {
              agentId: 'data-validator',
              agentName: 'Data Validator',
              status: 'idle',
              config: {},
              performance: { successRate: 98, avgResponseTime: 150 }
            },
          },
          {
            id: 'check',
            type: 'conditional',
            position: { x: 450, y: 100 },
            data: { condition: 'Valid Data?' },
          },
          {
            id: 'setup',
            type: 'agent',
            position: { x: 650, y: 50 },
            data: {
              agentId: 'account-setup',
              agentName: 'Account Setup',
              status: 'idle',
              config: {},
              performance: { successRate: 95, avgResponseTime: 200 }
            },
          }
        ];
        templateEdges = [
          { id: 'e1-2', source: 'start', target: 'validate', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e2-3', source: 'validate', target: 'check', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e3-4', source: 'check', target: 'setup', sourceHandle: 'true', markerEnd: { type: MarkerType.ArrowClosed } },
        ];
        break;
      case 'booking-process':
        templateNodes = [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 50, y: 100 },
            data: { trigger: 'Booking Request' },
          },
          {
            id: 'search',
            type: 'agent',
            position: { x: 250, y: 100 },
            data: {
              agentId: 'search-agent',
              agentName: 'Search Agent',
              status: 'idle',
              config: {},
              performance: { successRate: 92, avgResponseTime: 300 }
            },
          },
          {
            id: 'available',
            type: 'conditional',
            position: { x: 450, y: 100 },
            data: { condition: 'Available?' },
          },
          {
            id: 'book',
            type: 'agent',
            position: { x: 650, y: 50 },
            data: {
              agentId: 'booking-agent',
              agentName: 'Booking Agent',
              status: 'idle',
              config: {},
              performance: { successRate: 97, avgResponseTime: 500 }
            },
          }
        ];
        templateEdges = [
          { id: 'e1-2', source: 'start', target: 'search', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e2-3', source: 'search', target: 'available', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e3-4', source: 'available', target: 'book', sourceHandle: 'true', markerEnd: { type: MarkerType.ArrowClosed } },
        ];
        break;
      case 'support-escalation':
        templateNodes = [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 50, y: 100 },
            data: { trigger: 'Support Ticket' },
          },
          {
            id: 'classify',
            type: 'agent',
            position: { x: 250, y: 100 },
            data: {
              agentId: 'ticket-classifier',
              agentName: 'Ticket Classifier',
              status: 'idle',
              config: {},
              performance: { successRate: 94, avgResponseTime: 100 }
            },
          },
          {
            id: 'priority',
            type: 'conditional',
            position: { x: 450, y: 100 },
            data: { condition: 'High Priority?' },
          },
          {
            id: 'escalate',
            type: 'agent',
            position: { x: 650, y: 50 },
            data: {
              agentId: 'escalation-agent',
              agentName: 'Escalation Agent',
              status: 'idle',
              config: {},
              performance: { successRate: 99, avgResponseTime: 80 }
            },
          }
        ];
        templateEdges = [
          { id: 'e1-2', source: 'start', target: 'classify', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e2-3', source: 'classify', target: 'priority', markerEnd: { type: MarkerType.ArrowClosed } },
          { id: 'e3-4', source: 'priority', target: 'escalate', sourceHandle: 'true', markerEnd: { type: MarkerType.ArrowClosed } },
        ];
        break;
    }

    setNodes(templateNodes);
    setEdges(templateEdges);
    setSelectedTemplate(templateId);
  };

  return (
    <div className="grid grid-cols-4 gap-6 h-[800px]">
      {/* Workflow Canvas */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Workflow Builder</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveWorkflow}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === template.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => {
                  loadTemplate(template.id);
                  console.log('Template loaded:', template.name);
                }}
              >
                <div className="font-medium text-xs">{template.name}</div>
                <div className="text-xs opacity-80 mb-1">
                  {template.description}
                </div>
                <div className="flex justify-between text-xs opacity-70">
                  <span>{template.nodes} nodes</span>
                  <span>{template.estimatedTime}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};