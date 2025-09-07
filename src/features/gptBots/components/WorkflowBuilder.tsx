import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, Plus, X, ArrowRight, Clock, Target } from 'lucide-react';
import { useGPTBotIntegration } from '@/hooks/useGPTBotIntegration';
import { useWorkflowOrchestrator, WorkflowStep } from '@/hooks/useWorkflowOrchestrator';
import { useToast } from '@/hooks/use-toast';

interface WorkflowBuilderProps {
  onWorkflowExecuted?: (result: any) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onWorkflowExecuted }) => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [prompt, setPrompt] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [selectedBotId, setSelectedBotId] = useState('');
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);

  const { bots, loadBots } = useGPTBotIntegration();
  const { 
    isExecuting, 
    currentExecution, 
    startWorkflow, 
    getWorkflowTemplates,
    cancelExecution 
  } = useWorkflowOrchestrator();
  const { toast } = useToast();

  useEffect(() => {
    loadBots();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templateData = await getWorkflowTemplates();
      setTemplates(templateData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const addStep = () => {
    if (!selectedBotId || !stepName) {
      toast({
        title: "Missing Information",
        description: "Please select a bot and enter a step name",
        variant: "destructive"
      });
      return;
    }

    const newStep: WorkflowStep = {
      bot_id: selectedBotId,
      step_name: stepName,
      description: stepDescription || stepName
    };

    setWorkflowSteps(prev => [...prev, newStep]);
    setSelectedBotId('');
    setStepName('');
    setStepDescription('');
  };

  const removeStep = (index: number) => {
    setWorkflowSteps(prev => prev.filter((_, i) => i !== index));
  };

  const executeWorkflow = async () => {
    if (workflowSteps.length === 0 || !prompt) {
      toast({
        title: "Invalid Workflow",
        description: "Please add at least one step and enter a prompt",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await startWorkflow(workflowSteps, prompt);
      
      if (onWorkflowExecuted) {
        onWorkflowExecuted(result);
      }

      toast({
        title: "Workflow Completed",
        description: `Successfully executed ${workflowSteps.length} steps`,
      });

    } catch (error) {
      console.error('Workflow execution error:', error);
    }
  };

  const loadTemplate = (template: any) => {
    setWorkflowName(template.workflow_name);
    setWorkflowSteps(template.workflow_steps || []);
    toast({
      title: "Template Loaded",
      description: `Loaded ${template.workflow_name} with ${template.workflow_steps?.length || 0} steps`,
    });
  };

  const getBotName = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    return bot?.bot_name || botId;
  };

  return (
    <div className="space-y-6">
      {/* Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workflow Templates
          </CardTitle>
          <CardDescription>
            Pre-built workflows for common business processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="cursor-pointer hover:bg-accent" onClick={() => loadTemplate(template)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{template.workflow_name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{template.category}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {template.estimated_duration_minutes}m
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Builder</CardTitle>
          <CardDescription>
            Create custom multi-bot workflows for complex tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workflow Name */}
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input
              id="workflow-name"
              placeholder="Enter workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
            />
          </div>

          {/* Add Step */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Add Workflow Step</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bot-select">Select Bot</Label>
                <select
                  id="bot-select"
                  className="w-full p-2 border rounded-md"
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                >
                  <option value="">Choose a bot...</option>
                  {bots.map(bot => (
                    <option key={bot.id} value={bot.id}>
                      {bot.bot_name} - {bot.category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="step-name">Step Name</Label>
                <Input
                  id="step-name"
                  placeholder="e.g., Research Phase"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-description">Step Description</Label>
              <Input
                id="step-description"
                placeholder="Describe what this step accomplishes..."
                value={stepDescription}
                onChange={(e) => setStepDescription(e.target.value)}
              />
            </div>
            <Button onClick={addStep} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {/* Workflow Steps */}
          {workflowSteps.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Workflow Steps</h4>
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {workflowSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.step_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getBotName(step.bot_id)} • {step.description}
                        </div>
                      </div>
                      {index < workflowSteps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Separator />

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="workflow-prompt">Initial Prompt</Label>
            <Textarea
              id="workflow-prompt"
              placeholder="Enter the initial prompt that will be processed through your workflow..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* Execute Button */}
          <div className="flex gap-2">
            <Button 
              onClick={executeWorkflow} 
              disabled={isExecuting || workflowSteps.length === 0 || !prompt}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isExecuting ? 'Executing...' : 'Execute Workflow'}
            </Button>
            {currentExecution && currentExecution.status === 'running' && (
              <Button 
                variant="outline" 
                onClick={() => cancelExecution(currentExecution.id)}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Execution Status */}
          {currentExecution && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Execution Status</div>
                    <div className="text-sm text-muted-foreground">
                      Step {currentExecution.current_step} of {workflowSteps.length}
                    </div>
                  </div>
                  <Badge variant={
                    currentExecution.status === 'completed' ? 'default' :
                    currentExecution.status === 'failed' ? 'destructive' :
                    currentExecution.status === 'cancelled' ? 'secondary' : 'default'
                  }>
                    {currentExecution.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};