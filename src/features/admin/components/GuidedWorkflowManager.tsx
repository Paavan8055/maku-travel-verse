import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAdminIntegration } from '../context/AdminIntegrationContext';
import { agentWorkflows, type AgentWorkflow, type WorkflowStep } from '../data/agentWorkflows';
import { supabase } from '@/integrations/supabase/client';

// Using imported workflows from constants

const GuidedWorkflowManager: React.FC = () => {
  const { state, startWorkflow } = useAdminIntegration();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);

  const currentWorkflow = state.activeWorkflow ? agentWorkflows.find(w => w.id === state.activeWorkflow) : null;

  useEffect(() => {
    if (state.activeWorkflow) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setIsCompleted(false);
    }
  }, [state.activeWorkflow]);

  if (!currentWorkflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guided Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            No active workflow. Use the AI Assistant to start a guided procedure.
          </p>
          <div className="grid gap-4">
            {agentWorkflows.map((workflow) => (
              <div key={workflow.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{workflow.title}</h3>
                  <Badge variant={workflow.difficulty === 'easy' ? 'secondary' : workflow.difficulty === 'medium' ? 'outline' : 'destructive'}>
                    {workflow.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{workflow.estimatedTime}</span>
                  <Button size="sm" onClick={() => startWorkflow(workflow.id)}>
                    Start Workflow
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = (completedSteps.size / currentWorkflow.steps.length) * 100;

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    if (completedSteps.size + 1 === currentWorkflow.steps.length) {
      setIsCompleted(true);
    }
  };

  const nextStep = () => {
    if (currentStep < currentWorkflow.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = currentWorkflow.steps[currentStep];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentWorkflow.title}
                <Badge variant={currentWorkflow.difficulty === 'easy' ? 'secondary' : currentWorkflow.difficulty === 'medium' ? 'outline' : 'destructive'}>
                  {currentWorkflow.difficulty}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{currentWorkflow.description}</p>
            </div>
            <Button variant="outline" onClick={() => startWorkflow('')}>
              Exit Workflow
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {completedSteps.size} of {currentWorkflow.steps.length} steps</span>
              <span>{currentWorkflow.estimatedTime}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workflow Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentWorkflow.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  index === currentStep ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : index === currentStep ? (
                  <Circle className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                 <div className="flex-1">
                   <div className="font-medium text-sm">{step.title}</div>
                   {!step.required && (
                     <Badge variant="outline" className="text-xs">Optional</Badge>
                   )}
                 </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Step Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               Step {currentStep + 1}: {currentStepData.title}
               {!currentStepData.required && (
                 <Badge variant="outline">Optional</Badge>
               )}
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{currentStepData.description}</p>
            
            {/* Step-specific content would go here */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <AlertCircle className="h-4 w-4" />
                Step Instructions
              </div>
              <p className="text-sm">
                Follow the instructions above to complete this step. Use the controls below to navigate between steps.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {!completedSteps.has(currentStepData.id) && (
                  <Button
                    variant="outline"
                    onClick={() => markStepComplete(currentStepData.id)}
                  >
                    Mark Complete
                  </Button>
                )}
                <Button
                  onClick={nextStep}
                  disabled={currentStep === currentWorkflow.steps.length - 1}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isCompleted && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Workflow Completed Successfully!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              All steps have been completed. The {currentWorkflow.title.toLowerCase()} process is now finished.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GuidedWorkflowManager;