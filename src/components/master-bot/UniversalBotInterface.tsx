import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, AlertCircle, CheckCircle, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMasterBotController, BotResult } from '@/hooks/useMasterBotController';
import { AdvancedAIServiceProvider, useAdvancedAI } from './AdvancedAIService';
import { AnalysisSelector } from './AnalysisSelector';
import { EnhancedResultsDisplay } from './EnhancedResultsDisplay';

interface UniversalBotInterfaceProps {
  dashboardType: 'user' | 'partner' | 'admin';
  className?: string;
}

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system' | 'analysis';
  content: string;
  timestamp: Date;
  metadata?: any;
  analysisResponse?: any;
}

const UniversalBotInterfaceInner: React.FC<UniversalBotInterfaceProps> = ({
  dashboardType,
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [currentAnalysisResponse, setCurrentAnalysisResponse] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    botResults,
    isExecutingCommand,
    executeAdminCommand,
    getHighPriorityResults,
  } = useMasterBotController(dashboardType);

  const { analyzeWithAI, streamResponse, isProcessing } = useAdvancedAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleAnalysisStart = async (query: string, config: any) => {
    // Add user message
    addMessage({
      type: 'user',
      content: query,
    });

    setIsStreaming(true);
    setActiveTab('chat');

    try {
      let finalResponse;
      
      // Use streaming for admin dashboard
      if (dashboardType === 'admin') {
        let streamedContent = '';
        
        // Add initial bot message
        addMessage({
          type: 'analysis',
          content: '',
        });

        finalResponse = await streamResponse(query, config, (chunk: string) => {
          streamedContent = chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'analysis') {
              newMessages[newMessages.length - 1].content = streamedContent;
            }
            return newMessages;
          });
        });
      } else {
        finalResponse = await analyzeWithAI(query, config);
        
        addMessage({
          type: 'analysis',
          content: finalResponse.content,
          analysisResponse: finalResponse,
        });
      }

      setCurrentAnalysisResponse(finalResponse);

    } catch (error) {
      console.error('Analysis error:', error);
      addMessage({
        type: 'system',
        content: 'Analysis failed. Please try again or contact support.',
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isExecutingCommand || isProcessing) return;

    const userMessage = inputValue;
    setInputValue('');
    
    // Add user message
    addMessage({
      type: 'user',
      content: userMessage,
    });

    setIsStreaming(true);

    try {
      // For admin dashboard with advanced analysis
      if (dashboardType === 'admin') {
        // Determine if this is an analysis request
        const isAnalysisRequest = userMessage.toLowerCase().includes('analyze') || 
                                 userMessage.toLowerCase().includes('performance') ||
                                 userMessage.toLowerCase().includes('revenue') ||
                                 userMessage.toLowerCase().includes('behavior');

        if (isAnalysisRequest) {
          // Use AI analysis
          const analysisConfig = {
            type: userMessage.toLowerCase().includes('revenue') ? 'revenue' as const :
                  userMessage.toLowerCase().includes('performance') ? 'performance' as const :
                  userMessage.toLowerCase().includes('behavior') ? 'user_behavior' as const :
                  'custom' as const,
            timeframe: '24h' as const,
            complexity: 'detailed' as const,
            parameters: {}
          };

          await handleAnalysisStart(userMessage, analysisConfig);
        } else {
          // Use traditional command execution
          const commandType = userMessage.toLowerCase().includes('optimize') ? 'optimization' :
                            userMessage.toLowerCase().includes('control') ? 'control' : 'query';

          const response = await executeAdminCommand(
            userMessage,
            commandType,
            [],
            {}
          );

          if (response) {
            addMessage({
              type: 'bot',
              content: response.response || 'Command executed successfully',
              metadata: response,
            });
          } else {
            addMessage({
              type: 'system',
              content: 'Command execution failed. Please try again.',
            });
          }
        }
      } else {
        // For user/partner dashboards, provide contextual assistance
        const contextualResponse = generateContextualResponse(userMessage, dashboardType, botResults);
        
        // Simulate streaming response
        let streamedContent = '';
        const fullResponse = contextualResponse;
        
        addMessage({
          type: 'bot',
          content: '',
        });

        for (let i = 0; i <= fullResponse.length; i += 3) {
          streamedContent = fullResponse.slice(0, i);
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1].content = streamedContent;
            }
            return newMessages;
          });
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const generateContextualResponse = (
    userMessage: string,
    dashboard: string,
    results: BotResult[]
  ): string => {
    const recentResults = results.slice(0, 5);
    const highPriorityResults = getHighPriorityResults();

    if (dashboard === 'user') {
      if (userMessage.toLowerCase().includes('travel') || userMessage.toLowerCase().includes('book')) {
        return `I can help you with travel planning! Based on recent activity, I see ${recentResults.length} recent bot results. Here are some personalized recommendations:\n\n• Check our latest travel deals\n• I can help optimize your booking preferences\n• Would you like me to search for specific destinations?`;
      }
      return `Hi! I'm your travel assistant. I can help you with booking, travel planning, and personalized recommendations. What would you like to explore today?`;
    }

    if (dashboard === 'partner') {
      if (userMessage.toLowerCase().includes('revenue') || userMessage.toLowerCase().includes('performance')) {
        return `Revenue optimization insights available! I found ${highPriorityResults.length} high-priority recommendations:\n\n• Dynamic pricing suggestions\n• Market intelligence updates\n• Performance optimization tips\n\nWould you like me to dive deeper into any specific area?`;
      }
      return `Welcome to your partner dashboard! I can provide revenue insights, market analysis, and property optimization recommendations. How can I help grow your business today?`;
    }

    return 'How can I assist you today?';
  };

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'bot':
        return <Bot className="h-4 w-4 text-primary" />;
      case 'analysis':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (dashboard: string) => {
    switch (dashboard) {
      case 'admin':
        return 'destructive';
      case 'partner':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`h-[800px] flex flex-col${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Enhanced Master Bot
          </div>
          <Badge variant={getBadgeVariant(dashboardType)}>
            {dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Start a conversation with the Enhanced Master Bot</p>
                    <p className="text-sm">
                      {dashboardType === 'admin' 
                        ? 'Advanced AI analysis, optimization, and control'
                        : `Intelligent assistance for ${dashboardType} operations`
                      }
                    </p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type !== 'user' && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {getMessageIcon(message.type)}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.type === 'system'
                            ? 'bg-warning/10 text-warning-foreground border border-warning/20'
                            : message.type === 'analysis'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Enhanced results display for analysis messages */}
                    {message.type === 'analysis' && message.analysisResponse && (
                      <div className="mt-4 ml-11">
                        <EnhancedResultsDisplay 
                          response={message.analysisResponse}
                          onApplyRecommendation={(rec) => {
                            console.log('Applying recommendation:', rec);
                            // Implement recommendation application logic
                          }}
                          onExportResults={() => {
                            console.log('Exporting results');
                            // Implement export logic
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {isStreaming && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <p className="text-sm">
                        {isProcessing ? 'Analyzing with AI...' : 'Processing...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <div className="flex gap-2 mt-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  dashboardType === 'admin'
                    ? 'Ask for analysis, optimization, or control (e.g., "Analyze revenue performance last 7 days")'
                    : 'Ask me anything about your travel needs...'
                }
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isExecutingCommand || isStreaming || isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isExecutingCommand || isStreaming || isProcessing}
                size="icon"
              >
                {isExecutingCommand || isStreaming || isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1">
            <ScrollArea className="h-full">
              <AnalysisSelector 
                onAnalysisStart={handleAnalysisStart}
                isProcessing={isProcessing || isStreaming}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="results" className="flex-1">
            <ScrollArea className="h-full">
              {currentAnalysisResponse ? (
                <EnhancedResultsDisplay 
                  response={currentAnalysisResponse}
                  onApplyRecommendation={(rec) => {
                    console.log('Applying recommendation:', rec);
                    // Implement recommendation application logic
                  }}
                  onExportResults={() => {
                    console.log('Exporting results');
                    // Implement export logic
                  }}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Analysis Results Yet</p>
                  <p className="text-sm">
                    Run an analysis from the Analysis tab or ask for analysis in the chat
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export const UniversalBotInterface: React.FC<UniversalBotInterfaceProps> = (props) => {
  return (
    <AdvancedAIServiceProvider>
      <UniversalBotInterfaceInner {...props} />
    </AdvancedAIServiceProvider>
  );
};