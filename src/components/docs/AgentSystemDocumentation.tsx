/**
 * 70-Agent System Documentation
 * 
 * This file contains comprehensive documentation for the MAKU Travel 70-Agent System.
 * It explains the architecture, how to add new agents, and best practices.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Users, 
  Shield, 
  Zap, 
  Book, 
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AgentSystemDocumentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-6 w-6" />
            70-Agent System Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Comprehensive guide to understanding, using, and extending the MAKU Travel 70-Agent System.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="adding-agents">Adding Agents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  Customer Agents (20)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Customer-facing agents that help with travel planning, booking assistance, and support.
                </p>
                <div className="space-y-1">
                  <Badge variant="outline">trip-planner</Badge>
                  <Badge variant="outline">booking-assistant</Badge>
                  <Badge variant="outline">price-monitor</Badge>
                  <Badge variant="outline">+ 17 more</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                  Admin Agents (35)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Administrative agents for internal operations, security, and customer support.
                </p>
                <div className="space-y-1">
                  <Badge variant="outline">fraud-detection</Badge>
                  <Badge variant="outline">refund-processing</Badge>
                  <Badge variant="outline">user-support</Badge>
                  <Badge variant="outline">+ 32 more</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Monitoring Agents (15)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  System monitoring and performance tracking agents for operational insights.
                </p>
                <div className="space-y-1">
                  <Badge variant="outline">system-health</Badge>
                  <Badge variant="outline">performance-tracker</Badge>
                  <Badge variant="outline">error-detector</Badge>
                  <Badge variant="outline">+ 12 more</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="architecture">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Core Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Dynamic Dispatcher</h4>
                    <p className="text-sm text-muted-foreground">
                      <code>supabase/functions/agents/index.ts</code><br/>
                      Routes requests to appropriate agent handlers based on agent ID.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Agent Configuration</h4>
                    <p className="text-sm text-muted-foreground">
                      <code>AGENT_CONFIGS</code> object<br/>
                      Maps agent IDs to their configurations, models, and categories.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Task Management</h4>
                    <p className="text-sm text-muted-foreground">
                      <code>agentic_tasks</code> table<br/>
                      Stores task lifecycle, progress, and results with real-time updates.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Admin Interface</h4>
                    <p className="text-sm text-muted-foreground">
                      Templates and workflows<br/>
                      Pre-built forms and guided processes for administrative tasks.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Request Flow</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
{`1. Client Request → /agents/{agentId}
2. Dynamic Dispatcher validates agent ID
3. Task record created in agentic_tasks table
4. Agent-specific prompt built
5. OpenAI API called with appropriate model
6. Response processed and task updated
7. Result returned to client`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adding-agents">
          <Card>
            <CardHeader>
              <CardTitle>Adding New Agents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Important</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Follow this exact process to ensure proper integration with the existing system.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 1: Add Agent Configuration</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
{`// In supabase/functions/agents/index.ts
const AGENT_CONFIGS = {
  // ... existing agents
  'new-agent-id': { 
    name: 'New Agent Name', 
    category: 'customer|admin|monitoring', 
    model: 'gpt-5-2025-08-07' 
  },
};`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 2: Add Agent Prompt</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
{`// In buildAgentPrompt function
const basePrompts = {
  // ... existing prompts
  'new-agent-id': \`You are a specialized agent for [purpose]. 
    Provide helpful and accurate responses for [specific tasks].\`,
};`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 3: Add Admin Template (if admin agent)</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
{`// In src/features/admin/constants/agentTemplates.ts
{
  id: 'new-agent-id',
  title: 'New Agent Template',
  description: 'Template description',
  category: 'user|booking|security|communication|financial|operational',
  estimatedTime: '5 minutes',
  difficulty: 'easy|medium|hard',
  template: 'Template content with {placeholders}',
  fields: [
    { name: 'fieldName', label: 'Field Label', type: 'text', required: true }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 4: Add Workflow (if admin agent)</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
{`// In src/features/admin/constants/agentWorkflows.ts
'new-agent-id': {
  id: 'new-agent-id',
  title: 'New Agent Workflow',
  description: 'Workflow description',
  estimatedTime: '10 minutes',
  difficulty: 'medium',
  category: 'user|booking|security|financial|operational',
  steps: [
    {
      id: 'step-1',
      title: 'Step Title',
      description: 'Step description',
      estimatedTime: '2 minutes'
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Automatic Deployment</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Once you've made these changes, the agent will be automatically deployed and available for use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Template System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Templates provide pre-built forms for administrative tasks with placeholder substitution.
              </p>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Template Structure</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
{`interface AgentTemplate {
  id: string;              // Unique identifier
  title: string;           // Display name
  description: string;     // Brief description
  category: string;        // Grouping category
  estimatedTime: string;   // Time estimate
  difficulty: string;      // Complexity level
  template: string;        // Template with {placeholders}
  fields: TemplateField[]; // Form fields configuration
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Field Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <code className="text-sm font-medium">text</code>
                    <p className="text-xs text-muted-foreground">Single line text input</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <code className="text-sm font-medium">email</code>
                    <p className="text-xs text-muted-foreground">Email validation</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <code className="text-sm font-medium">textarea</code>
                    <p className="text-xs text-muted-foreground">Multi-line text</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <code className="text-sm font-medium">select</code>
                    <p className="text-xs text-muted-foreground">Dropdown with options</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Workflow System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Workflows provide step-by-step guidance for complex administrative processes.
              </p>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Workflow Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Progress Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Visual progress indicator with step completion status.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Time Estimates</h4>
                    <p className="text-sm text-muted-foreground">
                      Per-step and total workflow time estimates.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Optional Steps</h4>
                    <p className="text-sm text-muted-foreground">
                      Support for optional steps that can be skipped.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Validation Hooks</h4>
                    <p className="text-sm text-muted-foreground">
                      Custom validation logic for each step.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Automation Levels</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">manual</Badge>
                    <span className="text-sm">Requires human input for each step</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">semi-automated</Badge>
                    <span className="text-sm">Some steps can be automated</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">fully-automated</Badge>
                    <span className="text-sm">Entire workflow can run automatically</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>Testing Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Testing New Agents</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">1. Configuration Test</h4>
                    <p className="text-sm text-muted-foreground mb-2">Verify agent appears in system:</p>
                    <div className="bg-muted rounded p-2">
                      <code className="text-xs">Check AGENT_CONFIGS contains new agent</code>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">2. Task Creation Test</h4>
                    <p className="text-sm text-muted-foreground mb-2">Test task creation and execution:</p>
                    <div className="bg-muted rounded p-2">
                      <code className="text-xs">POST /agents/new-agent-id with test parameters</code>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">3. Template Rendering Test</h4>
                    <p className="text-sm text-muted-foreground mb-2">Verify admin templates work:</p>
                    <div className="bg-muted rounded p-2">
                      <code className="text-xs">Check template appears in AdminTaskAssistant</code>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">4. Workflow Test</h4>
                    <p className="text-sm text-muted-foreground mb-2">Test guided workflows:</p>
                    <div className="bg-muted rounded p-2">
                      <code className="text-xs">Navigate through all workflow steps</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Automated Testing</h3>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
{`// Example test for new agent
describe('New Agent', () => {
  it('should create task successfully', async () => {
    const response = await supabase.functions.invoke('agents/new-agent-id', {
      body: { intent: 'test', params: {}, userId: 'test-user' }
    });
    expect(response.data.success).toBe(true);
  });
  
  it('should render template correctly', () => {
    const template = agentTemplates.find(t => t.id === 'new-agent-id');
    expect(template).toBeDefined();
    expect(template.fields.length).toBeGreaterThan(0);
  });
});`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentSystemDocumentation;
