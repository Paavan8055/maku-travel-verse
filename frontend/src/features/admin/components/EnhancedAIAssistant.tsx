import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, CheckCircle, Clock, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminDataContext } from '@/components/admin/RealTimeAdminData';
import { useAdminAI } from '../hooks/useAdminAI';

interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  action?: () => Promise<void>;
  validation?: () => Promise<boolean>;
  subSteps?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  troubleshootingSteps?: TroubleshootingStep[];
  isStepByStep?: boolean;
}

export const EnhancedAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your enhanced admin assistant. I'll guide you through troubleshooting with clear, step-by-step instructions. What issue would you like help with?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeWorkflow, setActiveWorkflow] = useState<TroubleshootingStep[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const adminData = useAdminDataContext();
  const { analyzeIssue, executeRecovery } = useAdminAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Pre-built troubleshooting workflows
  const troubleshootingWorkflows = {
    payment_issues: [
      {
        id: 'step1',
        title: 'Check Payment System Status',
        description: 'First, let\'s verify if the payment system is responding properly.',
        status: 'pending' as const,
        subSteps: [
          'Checking Stripe connection',
          'Verifying webhook endpoints',
          'Testing API response times'
        ]
      },
      {
        id: 'step2',
        title: 'Review Recent Payment Failures',
        description: 'Let\'s look at recent payment attempts to identify patterns.',
        status: 'pending' as const,
        subSteps: [
          'Analyzing last 50 payment attempts',
          'Identifying common error codes',
          'Checking timeout issues'
        ]
      },
      {
        id: 'step3',
        title: 'Fix Payment Service',
        description: 'Based on our findings, let\'s restart the payment service.',
        status: 'pending' as const,
        action: async () => {
          await executeRecovery('restart_payment_service');
        }
      },
      {
        id: 'step4',
        title: 'Verify Resolution',
        description: 'Let\'s test the payment system to confirm it\'s working.',
        status: 'pending' as const,
        validation: async () => {
          // Simulate payment test
          await new Promise(resolve => setTimeout(resolve, 2000));
          return Math.random() > 0.2; // 80% success rate
        }
      }
    ],
    booking_failures: [
      {
        id: 'step1',
        title: 'Check Provider Connections',
        description: 'Let\'s verify all booking providers are accessible.',
        status: 'pending' as const,
        subSteps: [
          'Testing Amadeus API',
          'Checking HotelBeds connection',
          'Verifying Sabre availability'
        ]
      },
      {
        id: 'step2',
        title: 'Review Booking Errors',
        description: 'Analyzing recent booking attempts for error patterns.',
        status: 'pending' as const
      },
      {
        id: 'step3',
        title: 'Reset Booking Service',
        description: 'Restarting booking services to clear any stuck processes.',
        status: 'pending' as const,
        action: async () => {
          await executeRecovery('reset_booking_service');
        }
      }
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Determine if this requires step-by-step troubleshooting
      const inputLower = input.toLowerCase();
      let workflow = null;
      let workflowType = '';

      if (inputLower.includes('payment') || inputLower.includes('stripe')) {
        workflow = [...troubleshootingWorkflows.payment_issues];
        workflowType = 'payment issues';
      } else if (inputLower.includes('booking') || inputLower.includes('reservation')) {
        workflow = [...troubleshootingWorkflows.booking_failures];
        workflowType = 'booking problems';
      }

      if (workflow) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I'll help you resolve ${workflowType} with a step-by-step approach. Here's what we'll do:`,
          timestamp: new Date(),
          troubleshootingSteps: workflow,
          isStepByStep: true
        };

        setMessages(prev => [...prev, assistantMessage]);
        setActiveWorkflow(workflow);
        setCurrentStepIndex(0);
      } else {
        // Regular AI response for non-workflow queries
        const context = {
          criticalAlerts: adminData.criticalAlerts,
          providerHealth: adminData.providerHealth,
          systemLogs: adminData.systemLogs,
          metrics: adminData.getMetricsSummary(),
          healthStatus: adminData.getHealthStatus()
        };

        const response = await analyzeIssue(input, context);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.explanation,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble understanding that right now. Can you try asking about a specific issue like 'payment problems' or 'booking failures'?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeStep = async (stepIndex: number) => {
    if (!activeWorkflow) return;

    const step = activeWorkflow[stepIndex];
    const updatedWorkflow = [...activeWorkflow];
    updatedWorkflow[stepIndex] = { ...step, status: 'in-progress' };
    setActiveWorkflow(updatedWorkflow);

    // Update the message with the new workflow status
    setMessages(prev => prev.map(msg => 
      msg.isStepByStep && msg.troubleshootingSteps ? 
        { ...msg, troubleshootingSteps: updatedWorkflow } : 
        msg
    ));

    try {
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (step.action) {
        await step.action();
      }

      let success = true;
      if (step.validation) {
        success = await step.validation();
      }

      updatedWorkflow[stepIndex] = { 
        ...step, 
        status: success ? 'completed' : 'failed' 
      };
      setActiveWorkflow(updatedWorkflow);

      // Update message again
      setMessages(prev => prev.map(msg => 
        msg.isStepByStep && msg.troubleshootingSteps ? 
          { ...msg, troubleshootingSteps: updatedWorkflow } : 
          msg
      ));

      if (success && stepIndex < activeWorkflow.length - 1) {
        setCurrentStepIndex(stepIndex + 1);
      } else if (success) {
        // Workflow completed
        const completionMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ Troubleshooting completed successfully! The issue should be resolved now. Is there anything else you need help with?',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
        setActiveWorkflow(null);
        setCurrentStepIndex(0);
      } else {
        // Step failed
        const failureMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Step ${stepIndex + 1} failed. Let me suggest an alternative approach or you can contact technical support for manual intervention.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, failureMessage]);
      }

    } catch (error) {
      updatedWorkflow[stepIndex] = { ...step, status: 'failed' };
      setActiveWorkflow(updatedWorkflow);
      setMessages(prev => prev.map(msg => 
        msg.isStepByStep && msg.troubleshootingSteps ? 
          { ...msg, troubleshootingSteps: updatedWorkflow } : 
          msg
      ));
    }
  };

  const quickActions = [
    'Fix payment issues',
    'Resolve booking problems', 
    'Check system health',
    'Reset provider connections',
    'Explain current alerts'
  ];

  const renderTroubleshootingSteps = (steps: TroubleshootingStep[]) => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const progressPercentage = (completedSteps / steps.length) * 100;

    return (
      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Troubleshooting Progress</h4>
          <Badge variant="outline">{completedSteps} / {steps.length} completed</Badge>
        </div>
        
        <Progress value={progressPercentage} className="mb-4" />
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {step.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {step.status === 'in-progress' && (
                  <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                )}
                {step.status === 'failed' && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                {step.status === 'pending' && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    Step {index + 1}: {step.title}
                  </p>
                  {step.status === 'pending' && index === currentStepIndex && (
                    <Button 
                      size="sm" 
                      onClick={() => executeStep(index)}
                      className="gap-2"
                    >
                      Start <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                  {step.status === 'failed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => executeStep(index)}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" /> Retry
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
                
                {step.subSteps && step.status === 'in-progress' && (
                  <div className="mt-2 ml-4 space-y-1">
                    {step.subSteps.map((subStep, subIndex) => (
                      <div key={subIndex} className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <div className="h-1 w-1 bg-muted-foreground rounded-full"></div>
                        <span>{subStep}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => setInput(action)}
                disabled={isLoading}
                className="text-xs justify-start"
              >
                {action}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Chat Interface */}
      <Card className="h-[700px] flex flex-col">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Enhanced AI Assistant</CardTitle>
          </div>
          <div className="ml-auto">
            <Badge variant={adminData.getHealthStatus() === 'healthy' ? 'default' : 'destructive'}>
              {adminData.getHealthStatus()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4 p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    
                    {message.troubleshootingSteps && (
                      renderTroubleshootingSteps(message.troubleshootingSteps)
                    )}
                    
                    <div className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4 flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Analyzing and preparing troubleshooting steps...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-4 pb-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the issue you're experiencing (e.g., 'payment failures', 'booking errors')..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              💡 For best results, describe specific issues like "payment problems" or "booking failures"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};