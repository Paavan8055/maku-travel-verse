import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Brain, GitBranch, Lightbulb, TrendingUp, Clock, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReasoningRequest {
  type: 'chain_of_thought' | 'prompt_chain' | 'travel_optimization' | 'decision_tree';
  problem: string;
  context: Record<string, any>;
  constraints?: any[];
  objectives?: string[];
}

interface ReasoningResponse {
  success: boolean;
  reasoning_type: string;
  result: any;
  confidence: number;
  execution_time_ms: number;
  reasoning_trace: Array<{
    step: string;
    input: any;
    output: any;
    reasoning: string;
    confidence: number;
  }>;
  improvements_suggested: string[];
}

interface ReasoningMetrics {
  total_executions: number;
  success_rate: number;
  average_confidence: number;
  average_execution_time: number;
  problem_type_breakdown: Record<string, number>;
  user_satisfaction_trend: number[];
  improvement_suggestions: string[];
}

export const AdvancedReasoningDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('execute');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<ReasoningMetrics | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<ReasoningResponse[]>([]);

  // Form state
  const [reasoningType, setReasoningType] = useState<ReasoningRequest['type']>('chain_of_thought');
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('{}');
  const [objectives, setObjectives] = useState<string[]>(['cost', 'time', 'satisfaction']);
  const [lastResult, setLastResult] = useState<ReasoningResponse | null>(null);

  useEffect(() => {
    loadMetrics();
    loadRecentExecutions();
  }, []);

  const loadMetrics = async () => {
    try {
      // This would call the advanced reasoning integration to get metrics
      // For now, simulate the data structure
      const mockMetrics: ReasoningMetrics = {
        total_executions: 47,
        success_rate: 0.89,
        average_confidence: 0.82,
        average_execution_time: 2150,
        problem_type_breakdown: {
          'chain_of_thought': 18,
          'prompt_chain': 12,
          'travel_optimization': 10,
          'decision_tree': 7
        },
        user_satisfaction_trend: [0.75, 0.78, 0.82, 0.85, 0.89],
        improvement_suggestions: [
          'Implement user feedback collection',
          'Add more travel-specific reasoning templates',
          'Optimize execution time for complex problems'
        ]
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load reasoning metrics",
        variant: "destructive"
      });
    }
  };

  const loadRecentExecutions = async () => {
    try {
      // Load recent executions from memory
      const { data, error } = await supabase
        .from('agent_context_memory')
        .select('*')
        .eq('agent_id', 'advanced_reasoning')
        .eq('context_type', 'reasoning_execution')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const executions = data?.map(record => {
        const contextData = record.context_data as any;
        return {
          success: contextData?.performance?.success || false,
          reasoning_type: contextData?.request?.type || 'unknown',
          result: contextData?.result,
          confidence: record.confidence_score || 0,
          execution_time_ms: contextData?.performance?.execution_time_ms || 0,
          reasoning_trace: [],
          improvements_suggested: []
        };
      }) || [];

      setRecentExecutions(executions);
    } catch (error) {
      console.error('Failed to load recent executions:', error);
    }
  };

  const executeReasoning = async () => {
    if (!problem.trim()) {
      toast({
        title: "Error",
        description: "Please provide a problem to solve",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let parsedContext = {};
      try {
        parsedContext = JSON.parse(context);
      } catch {
        parsedContext = { raw_context: context };
      }

      const request: ReasoningRequest = {
        type: reasoningType,
        problem,
        context: parsedContext,
        objectives: reasoningType === 'travel_optimization' ? objectives : undefined
      };

      // This would call the Supabase edge function for advanced reasoning
      const { data, error } = await supabase.functions.invoke('advanced-reasoning', {
        body: request
      });

      if (error) throw error;

      const result = data as ReasoningResponse;
      setLastResult(result);
      
      // Refresh metrics and recent executions
      await loadMetrics();
      await loadRecentExecutions();

      toast({
        title: "Success",
        description: `Reasoning completed with ${(result.confidence * 100).toFixed(1)}% confidence`,
      });

    } catch (error) {
      console.error('Reasoning execution failed:', error);
      toast({
        title: "Error",
        description: "Failed to execute reasoning",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getReasoningTypeIcon = (type: string) => {
    switch (type) {
      case 'chain_of_thought': return <Brain className="w-4 h-4" />;
      case 'prompt_chain': return <GitBranch className="w-4 h-4" />;
      case 'travel_optimization': return <Target className="w-4 h-4" />;
      case 'decision_tree': return <Lightbulb className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Advanced Reasoning System</h2>
        <Badge variant="outline" className="text-sm">
          90% Agentic Completion
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="execute">Execute Reasoning</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="chains">Prompt Chains</TabsTrigger>
        </TabsList>

        <TabsContent value="execute" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Reasoning Configuration
                </CardTitle>
                <CardDescription>
                  Configure and execute advanced reasoning tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reasoning-type">Reasoning Type</Label>
                  <Select value={reasoningType} onValueChange={(value) => setReasoningType(value as ReasoningRequest['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chain_of_thought">Chain of Thought</SelectItem>
                      <SelectItem value="prompt_chain">Prompt Chain</SelectItem>
                      <SelectItem value="travel_optimization">Travel Optimization</SelectItem>
                      <SelectItem value="decision_tree">Decision Tree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problem Statement</Label>
                  <Textarea
                    id="problem"
                    placeholder="Describe the problem you want to solve..."
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Context (JSON)</Label>
                  <Textarea
                    id="context"
                    placeholder='{"budget": 2000, "destination": "Tokyo", "duration": 7}'
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={3}
                  />
                </div>

                {reasoningType === 'travel_optimization' && (
                  <div className="space-y-2">
                    <Label>Optimization Objectives</Label>
                    <div className="flex flex-wrap gap-2">
                      {['cost', 'time', 'satisfaction', 'efficiency', 'sustainability'].map(obj => (
                        <Badge
                          key={obj}
                          variant={objectives.includes(obj) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (objectives.includes(obj)) {
                              setObjectives(prev => prev.filter(o => o !== obj));
                            } else {
                              setObjectives(prev => [...prev, obj]);
                            }
                          }}
                        >
                          {obj}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={executeReasoning} disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Execute Reasoning'}
                </Button>
              </CardContent>
            </Card>

            {lastResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Reasoning Result
                  </CardTitle>
                  <CardDescription>
                    Latest execution result and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success</span>
                    <Badge variant={lastResult.success ? 'default' : 'destructive'}>
                      {lastResult.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confidence</span>
                    <span className={`font-semibold ${getConfidenceColor(lastResult.confidence)}`}>
                      {(lastResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Execution Time</span>
                    <span className="text-sm">{lastResult.execution_time_ms}ms</span>
                  </div>

                  <Progress value={lastResult.confidence * 100} className="w-full" />

                  {lastResult.reasoning_trace.length > 0 && (
                    <div className="space-y-2">
                      <Label>Reasoning Steps</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {lastResult.reasoning_trace.map((step, index) => (
                          <div key={index} className="p-2 bg-muted rounded-md text-sm">
                            <div className="font-medium">{step.step}</div>
                            <div className="text-muted-foreground text-xs mt-1">
                              Confidence: {(step.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lastResult.improvements_suggested.length > 0 && (
                    <div className="space-y-2">
                      <Label>Suggested Improvements</Label>
                      <div className="space-y-1">
                        {lastResult.improvements_suggested.map((suggestion, index) => (
                          <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                  <Brain className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total_executions}</div>
                  <p className="text-xs text-muted-foreground">
                    Reasoning tasks completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(metrics.success_rate * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Tasks completed successfully
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                  <Target className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(metrics.average_confidence * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Average reasoning confidence
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.average_execution_time.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground">
                    Average execution time
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Problem Type Distribution</CardTitle>
                  <CardDescription>Breakdown of reasoning types used</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.problem_type_breakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getReasoningTypeIcon(type)}
                          <span className="text-sm font-medium capitalize">
                            {type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2" 
                              style={{ width: `${(count / metrics.total_executions) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Improvement Suggestions</CardTitle>
                  <CardDescription>System recommendations for optimization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.improvement_suggestions.map((suggestion, index) => (
                      <Alert key={index}>
                        <Lightbulb className="w-4 h-4" />
                        <AlertDescription>{suggestion}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Latest reasoning task results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExecutions.map((execution, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getReasoningTypeIcon(execution.reasoning_type)}
                      <div>
                        <div className="font-medium capitalize">
                          {execution.reasoning_type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {execution.execution_time_ms}ms execution
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={execution.success ? 'default' : 'destructive'}>
                        {execution.success ? 'Success' : 'Failed'}
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(execution.confidence)}`}>
                        {(execution.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {recentExecutions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No recent executions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Prompt Chains</CardTitle>
              <CardDescription>Pre-configured reasoning chains for common problems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4" />
                    <h3 className="font-medium">Comprehensive Travel Planning</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    End-to-end travel planning with analysis, optimization, and booking strategy
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Travel Analysis</Badge>
                    <Badge variant="outline" className="text-xs">Itinerary Optimization</Badge>
                    <Badge variant="outline" className="text-xs">Booking Strategy</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4" />
                    <h3 className="font-medium">Complex Problem Solving</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Systematic approach to complex problem resolution with creative solutions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Problem Decomposition</Badge>
                    <Badge variant="outline" className="text-xs">Creative Solutions</Badge>
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