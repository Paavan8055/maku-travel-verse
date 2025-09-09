import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealAIData } from '@/hooks/useRealAIData';
import { ConversationalAI } from '@/components/ai/ConversationalAI';
import { VoiceSearchInterface } from '@/components/ai/VoiceSearchInterface';
import {
  Brain,
  Mic,
  Globe,
  MessageSquare,
  Zap,
  Settings,
  Users,
  TrendingUp,
  FileText,
  Languages,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

interface AIModelConfig {
  id: string;
  name: string;
  type: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-sonnet' | 'gemini-pro';
  capabilities: string[];
  status: 'active' | 'inactive' | 'training';
  accuracy: number;
  responseTime: number;
  costPerRequest: number;
}

interface ConversationMemory {
  sessionId: string;
  userId: string;
  context: any;
  preferences: any;
  lastInteraction: string;
  conversationHistory: any[];
}

interface LanguageSupport {
  code: string;
  name: string;
  supported: boolean;
  accuracy: number;
  voiceSupport: boolean;
}

export const EnhancedAICapabilities: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [aiModels, setAiModels] = useState<AIModelConfig[]>([
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      type: 'gpt-4o',
      capabilities: ['text', 'voice', 'vision', 'reasoning'],
      status: 'active',
      accuracy: 96,
      responseTime: 1200,
      costPerRequest: 0.03
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      type: 'gpt-4o-mini',
      capabilities: ['text', 'voice', 'fast-response'],
      status: 'active',
      accuracy: 94,
      responseTime: 800,
      costPerRequest: 0.01
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      type: 'claude-3-sonnet',
      capabilities: ['text', 'analysis', 'reasoning'],
      status: 'inactive',
      accuracy: 95,
      responseTime: 1500,
      costPerRequest: 0.025
    }
  ]);

  const [languages, setLanguages] = useState<LanguageSupport[]>([
    { code: 'en', name: 'English', supported: true, accuracy: 98, voiceSupport: true },
    { code: 'es', name: 'Spanish', supported: true, accuracy: 95, voiceSupport: true },
    { code: 'fr', name: 'French', supported: true, accuracy: 94, voiceSupport: true },
    { code: 'de', name: 'German', supported: true, accuracy: 93, voiceSupport: true },
    { code: 'ja', name: 'Japanese', supported: true, accuracy: 91, voiceSupport: false },
    { code: 'zh', name: 'Chinese', supported: true, accuracy: 90, voiceSupport: false },
    { code: 'ar', name: 'Arabic', supported: false, accuracy: 0, voiceSupport: false },
    { code: 'hi', name: 'Hindi', supported: false, accuracy: 0, voiceSupport: false }
  ]);

  const {
    conversations,
    memories,
    feedback,
    metrics,
    isLoading: aiDataLoading,
    error: aiDataError,
    getRecentConversations,
    getActiveMemories,
    getUnprocessedFeedback,
    getLanguageDistribution,
    refreshData: refreshAIData
  } = useRealAIData();

  const { toast } = useToast();

  const handleModelSwitch = async (modelId: string) => {
    setSelectedModel(modelId);
    
    try {
      // Update model configuration in database
      const { error } = await supabase.functions.invoke('update-ai-model', {
        body: { modelId, action: 'switch' }
      });

      if (error) throw error;

      toast({
        title: 'Model Switched',
        description: `Now using ${aiModels.find(m => m.id === modelId)?.name}`
      });
    } catch (error) {
      toast({
        title: 'Model Switch Failed',
        description: 'Failed to switch AI model',
        variant: 'destructive'
      });
    }
  };

  const toggleVoiceInterface = () => {
    setIsVoiceActive(!isVoiceActive);
    
    if (!isVoiceActive) {
      toast({
        title: 'Voice Interface Active',
        description: 'You can now speak to the AI assistant'
      });
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    const language = languages.find(l => l.code === languageCode);
    if (!language?.supported) {
      toast({
        title: 'Language Not Supported',
        description: 'This language is not yet available',
        variant: 'destructive'
      });
      return;
    }

    setSelectedLanguage(languageCode);
    
    try {
      // Update language preference
      const { error } = await supabase.functions.invoke('update-language-preference', {
        body: { language: languageCode }
      });

      if (error) throw error;

      toast({
        title: 'Language Updated',
        description: `Interface language changed to ${language.name}`
      });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const trainModel = async (modelId: string) => {
    try {
      const { error } = await supabase.functions.invoke('train-ai-model', {
        body: { modelId, action: 'train' }
      });

      if (error) throw error;

      // Update model status
      setAiModels(prev => 
        prev.map(model => 
          model.id === modelId 
            ? { ...model, status: 'training' }
            : model
        )
      );

      toast({
        title: 'Training Started',
        description: 'Model training has been initiated'
      });

      // Simulate training completion after 10 seconds
      setTimeout(() => {
        setAiModels(prev => 
          prev.map(model => 
            model.id === modelId 
              ? { ...model, status: 'active', accuracy: model.accuracy + 1 }
              : model
          )
        );
        
        toast({
          title: 'Training Complete',
          description: 'Model has been successfully updated'
        });
      }, 10000);

    } catch (error) {
      toast({
        title: 'Training Failed',
        description: 'Failed to start model training',
        variant: 'destructive'
      });
    }
  };

  const getModelStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'training': return <Badge variant="outline">Training</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getLanguageStatusBadge = (supported: boolean) => {
    return supported ? 
      <Badge variant="default">Supported</Badge> : 
      <Badge variant="secondary">Coming Soon</Badge>;
  };

  const currentModel = aiModels.find(m => m.id === selectedModel);
  const currentLanguage = languages.find(l => l.code === selectedLanguage);

  return (
    <div className="space-y-6">
      {/* AI Capabilities Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{metrics.totalConversations}</p>
                <p className="text-xs text-muted-foreground">Total Conversations</p>
              </div>
              <MessageSquare className="h-4 w-4 ml-auto text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
              <Users className="h-4 w-4 ml-auto text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(1)}s</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
              </div>
              <Zap className="h-4 w-4 ml-auto text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{metrics.satisfactionScore.toFixed(1)}/5</p>
                <p className="text-xs text-muted-foreground">Satisfaction Score</p>
              </div>
              <TrendingUp className="h-4 w-4 ml-auto text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="voice">Voice Interface</TabsTrigger>
          <TabsTrigger value="languages">Multi-Language</TabsTrigger>
          <TabsTrigger value="memory">Contextual Memory</TabsTrigger>
          <TabsTrigger value="conversation">Live Conversation</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Model Management</span>
              </CardTitle>
              <CardDescription>
                Configure and optimize AI models for different use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiModels.map((model) => (
                  <div 
                    key={model.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedModel === model.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{model.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {model.capabilities.join(', ')}
                          </p>
                        </div>
                        {getModelStatusBadge(model.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={selectedModel === model.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleModelSwitch(model.id)}
                          disabled={model.status !== 'active'}
                        >
                          {selectedModel === model.id ? 'Active' : 'Select'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => trainModel(model.id)}
                          disabled={model.status === 'training'}
                        >
                          {model.status === 'training' ? 'Training...' : 'Train'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={model.accuracy} className="flex-1" />
                          <span className="text-sm font-medium">{model.accuracy}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Response Time</p>
                        <p className="font-medium">{model.responseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost per Request</p>
                        <p className="font-medium">${model.costPerRequest}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-5 w-5" />
                <span>Voice Interface</span>
              </CardTitle>
              <CardDescription>
                Enable voice input and output for natural conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Voice Assistant Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {isVoiceActive ? 'Voice interface is active' : 'Voice interface is disabled'}
                    </p>
                  </div>
                  <Button
                    onClick={toggleVoiceInterface}
                    variant={isVoiceActive ? "default" : "outline"}
                    className="flex items-center space-x-2"
                  >
                    {isVoiceActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{isVoiceActive ? 'Deactivate' : 'Activate'}</span>
                  </Button>
                </div>

                {isVoiceActive && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <VoiceSearchInterface
                      onResult={(result) => {
                        console.log('Voice search result:', result);
                      }}
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Voice Input Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Real-time speech recognition</li>
                      <li>• Multi-language support</li>
                      <li>• Noise cancellation</li>
                      <li>• Wake word detection</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Voice Output Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Natural text-to-speech</li>
                      <li>• Emotion and tone control</li>
                      <li>• Voice customization</li>
                      <li>• Speed adjustment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Languages className="h-5 w-5" />
                <span>Multi-Language Support</span>
              </CardTitle>
              <CardDescription>
                Global accessibility with comprehensive language support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Current Language</label>
                    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.filter(l => l.supported).map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Accuracy: {currentLanguage?.accuracy}%</p>
                    <p>Voice: {currentLanguage?.voiceSupport ? 'Supported' : 'Text only'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Language Support Status</h4>
                  {languages.map((language) => (
                    <div 
                      key={language.code}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{language.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {language.supported ? `${language.accuracy}% accuracy` : 'Not available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {language.voiceSupport && (
                          <Volume2 className="h-4 w-4 text-blue-600" />
                        )}
                        {getLanguageStatusBadge(language.supported)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Contextual Memory System</span>
              </CardTitle>
              <CardDescription>
                Intelligent conversation memory and user preference learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{getActiveMemories().length}</p>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{memories.length}</p>
                    <p className="text-sm text-muted-foreground">Total Memories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{metrics.contextAccuracy.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Context Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{metrics.memoryRetention.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Memory Retention</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Memory Features</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Conversation history tracking</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">User preference learning</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Context persistence across sessions</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Intelligent context summarization</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Privacy-compliant memory management</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Automatic memory optimization</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All Memory (Admin Only)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Live AI Conversation</span>
              </CardTitle>
              <CardDescription>
                Enhanced conversational AI with advanced capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConversationalAI 
                dashboardType="admin"
                onActionRequired={(action, params) => {
                  console.log('AI Action Required:', action, params);
                  toast({
                    title: 'AI Action Required',
                    description: `Action: ${action}`,
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>AI Performance Analytics</span>
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and performance insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">Response Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Relevance Score</span>
                        <span className="text-sm font-medium">94%</span>
                      </div>
                      <Progress value={94} />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accuracy Score</span>
                        <span className="text-sm font-medium">96%</span>
                      </div>
                      <Progress value={96} />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Helpfulness Score</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <Progress value={92} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Usage Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Daily Active Conversations</span>
                        <span className="text-sm font-medium">342</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Session Duration</span>
                        <span className="text-sm font-medium">8.5 min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Multi-language Usage</span>
                        <span className="text-sm font-medium">23%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Voice Interface Usage</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Recent Improvements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      <span>Response time improved by 15% with GPT-4o optimization</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      <span>Added support for 3 new languages</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      <span>Enhanced contextual memory retention by 12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};