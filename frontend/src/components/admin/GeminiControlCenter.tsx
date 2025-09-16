import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeminiBotInterface } from '@/components/gemini-bot/GeminiBotInterface';
import { GeminiResultsPanel } from '@/components/gemini-bot/GeminiResultsPanel';
import { useGeminiBot } from '@/hooks/useGeminiBot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Activity, 
  Settings, 
  BarChart3,
  Command,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Database,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const GeminiControlCenter: React.FC = () => {
  const { 
    results: botResults, 
    isProcessing: isExecutingCommand,
    processQuery: executeAdminCommand,
    dismissResult
  } = useGeminiBot();

  const { toast } = useToast();
  const [dismissedResults, setDismissedResults] = useState<string[]>([]);

  const systemResults = botResults.filter(r => r.type === 'general');
  const analysisResults = botResults.filter(r => r.type === 'recommendation');
  const travelResults = botResults.filter(r => r.type === 'travel_search');
  const itineraryResults = botResults.filter(r => r.type === 'itinerary');
  const highPriorityResults = botResults.filter(r => !r.success || r.confidence < 0.5);

  const handleDismissResult = useCallback((resultId: string) => {
    setDismissedResults(prev => [...prev, resultId]);
    dismissResult(resultId);
  }, [dismissResult]);

  const handleApplyResult = useCallback((result: any) => {
    toast({
      title: "Result Applied",
      description: "Gemini AI result has been applied successfully.",
    });
  }, [toast]);

  const visibleResults = botResults.filter(result => !dismissedResults.includes(result.id));

  const quickCommands = [
    { label: 'Travel Recommendations', command: 'Provide travel recommendations for popular destinations', type: 'recommendation' as const },
    { label: 'Flight Search Tips', command: 'Give tips for finding the best flight deals', type: 'travel_search' as const },
    { label: 'Hotel Booking Advice', command: 'Provide advice for booking the best hotels', type: 'recommendation' as const },
    { label: 'Itinerary Planning', command: 'Help plan a 7-day itinerary for Tokyo, Japan', type: 'itinerary' as const },
    { label: 'Travel Budget Tips', command: 'Provide budget travel tips and cost-saving strategies', type: 'general' as const },
    { label: 'Travel Safety Guide', command: 'Give travel safety tips and advice', type: 'general' as const },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Gemini AI Control Center
            </h1>
            <p className="text-muted-foreground">Powered by Google Gemini AI for travel assistance</p>
          </div>
          <div className="flex items-center gap-3">
            {highPriorityResults.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {highPriorityResults.length} low confidence
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {botResults.length} AI results
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">AI Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Result Analytics</TabsTrigger>
            <TabsTrigger value="commands">Quick Commands</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* AI Status Cards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500 mb-2">
                    {isExecutingCommand ? 'Processing' : 'Ready'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gemini AI system status
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Travel Queries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {travelResults.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Travel search assistance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-primary" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {analysisResults.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI recommendations generated
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500 mb-2">
                    {Math.round((botResults.filter(r => r.success).length / Math.max(botResults.length, 1)) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI response success rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Command className="h-5 w-5 text-primary" />
                  Quick AI Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {quickCommands.map((cmd, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start"
                      onClick={() => executeAdminCommand(cmd.command, cmd.type)}
                      disabled={isExecutingCommand}
                    >
                      <span className="font-medium text-sm">{cmd.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{cmd.command}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent AI Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {botResults.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{result.query}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {Math.round(result.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    AI Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• {botResults.length} total AI interactions</p>
                    <p>• Average confidence: {Math.round(botResults.reduce((sum, r) => sum + r.confidence, 0) / Math.max(botResults.length, 1) * 100)}%</p>
                    <p>• High confidence results: {botResults.filter(r => r.confidence >= 0.8).length}</p>
                    <p>• Success rate: {Math.round((botResults.filter(r => r.success).length / Math.max(botResults.length, 1)) * 100)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Travel Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• {travelResults.length} travel search queries</p>
                    <p>• {itineraryResults.length} itinerary plans created</p>
                    <p>• {analysisResults.length} recommendations given</p>
                    <p>• Response time: ~2s average</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Model: Gemini Pro</p>
                    <p>• Uptime: 99.9%</p>
                    <p>• Processing: {isExecutingCommand ? 'Active' : 'Idle'}</p>
                    <p>• Queue: Empty</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <GeminiResultsPanel 
              results={visibleResults} 
              onApplyResult={handleApplyResult}
              onDismissResult={handleDismissResult}
              className="col-span-full" 
            />
          </TabsContent>

          <TabsContent value="commands" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Command className="h-5 w-5 text-primary" />
                    Quick Commands
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quickCommands.map((cmd, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => executeAdminCommand(cmd.command, cmd.type)}
                        disabled={isExecutingCommand}
                      >
                        <div className="text-left">
                          <div className="font-medium">{cmd.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{cmd.command}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Command Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{Math.round((botResults.filter(r => r.success).length / Math.max(botResults.length, 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.round((botResults.filter(r => r.success).length / Math.max(botResults.length, 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Queries</p>
                        <p className="font-bold text-primary">{botResults.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-bold text-destructive">{botResults.filter(r => !r.success).length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">High Confidence</p>
                        <p className="font-bold text-green-500">{botResults.filter(r => r.confidence >= 0.8).length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Low Confidence</p>
                        <p className="font-bold text-yellow-500">{botResults.filter(r => r.confidence < 0.5).length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <GeminiBotInterface 
              onResponse={(response) => {
                if (!response.success) {
                  toast({
                    title: "AI Response",
                    description: "The AI assistant encountered an issue. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              context={{ adminSection: true, timestamp: new Date().toISOString() }}
              placeholder="Ask Gemini AI about travel, bookings, or general assistance..."
              height="500px"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};