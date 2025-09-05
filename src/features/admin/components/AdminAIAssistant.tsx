import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, AlertTriangle, CheckCircle, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAdminDataContext } from '@/components/admin/RealTimeAdminData';
import { useAdminAI } from '../hooks/useAdminAI';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionButtons?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

export const AdminAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your admin assistant. I can help you troubleshoot issues, understand metrics, and guide you through system recovery. What can I help you with today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const adminData = useAdminDataContext();
  const { 
    analyzeIssue, 
    suggestSolution, 
    executeRecovery,
    detectPatterns 
  } = useAdminAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-detect critical issues and proactively suggest solutions
  useEffect(() => {
    if (adminData.criticalAlerts.length > 0) {
      const latestAlert = adminData.criticalAlerts[0];
      const autoMessage: Message = {
        id: `auto-${Date.now()}`,
        role: 'assistant',
        content: `🚨 I detected a critical issue: ${latestAlert.message}. Would you like me to help resolve this?`,
        timestamp: new Date(),
        actionButtons: [
          {
            label: 'Help me fix this',
            action: () => handleQuickAction(`Fix ${latestAlert.alert_type}`)
          },
          {
            label: 'Explain what this means',
            action: () => handleQuickAction(`Explain ${latestAlert.alert_type}`)
          }
        ]
      };
      
      // Only add if not already present
      if (!messages.some(m => m.content.includes(latestAlert.message))) {
        setMessages(prev => [...prev, autoMessage]);
      }
    }
  }, [adminData.criticalAlerts]);

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
      // Analyze the user's question with current system context
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
        timestamp: new Date(),
        actionButtons: response.suggestedActions?.map(action => ({
          label: action.label,
          action: () => handleActionButton(action),
          variant: action.severity === 'high' ? 'destructive' : 'default'
        }))
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble understanding that right now. Can you try rephrasing your question?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: action,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const context = {
        criticalAlerts: adminData.criticalAlerts,
        providerHealth: adminData.providerHealth,
        systemLogs: adminData.systemLogs,
        metrics: adminData.getMetricsSummary(),
        healthStatus: adminData.getHealthStatus()
      };

      const response = await analyzeIssue(action, context);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.explanation,
        timestamp: new Date(),
        actionButtons: response.suggestedActions?.map(actionItem => ({
          label: actionItem.label,
          action: () => handleActionButton(actionItem),
          variant: actionItem.severity === 'high' ? 'destructive' : 'default'
        }))
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionButton = async (action: any) => {
    setIsLoading(true);
    try {
      if (action.type === 'recovery') {
        const result = await executeRecovery(action.recoveryType);
        const resultMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.success 
            ? `✅ ${action.label} completed successfully! ${result.message}`
            : `❌ ${action.label} failed: ${result.message}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, resultMessage]);
      } else if (action.type === 'explanation') {
        const explanation = await suggestSolution(action.issueType);
        const explanationMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: explanation,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, explanationMessage]);
      }
    } catch (error) {
      console.error('Action button error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    'Check system health',
    'Fix payment issues',
    'Reset provider connections',
    'Explain current alerts',
    'Show booking trends'
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Assistant</CardTitle>
        </div>
        <div className="ml-auto">
          <Badge variant={adminData.getHealthStatus() === 'healthy' ? 'default' : 'destructive'}>
            {adminData.getHealthStatus()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4 p-0">
        {/* Quick Actions */}
        <div className="px-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
                className="text-xs"
              >
                {action}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  {message.actionButtons && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.actionButtons.map((button, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={button.variant || 'outline'}
                          onClick={button.action}
                          disabled={isLoading}
                          className="text-xs"
                        >
                          {button.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
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
              placeholder="Ask me about system issues, metrics, or recovery steps..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};