import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Zap,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticStep {
  step: string;
  status: 'completed' | 'analyzing' | 'pending' | 'failed';
  actions: string[];
  results?: any;
}

interface TroubleshootingSession {
  id: string;
  query: string;
  steps: DiagnosticStep[];
  analysis: any;
  recommendations: string[];
  escalationLevel: string;
  startTime: Date;
  status: 'active' | 'completed' | 'escalated';
}

export const AdvancedTroubleshootingEngine: React.FC = () => {
  const [query, setQuery] = useState('');
  const [currentSession, setCurrentSession] = useState<TroubleshootingSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('diagnostic');
  const { toast } = useToast();

  const startTroubleshooting = useCallback(async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please describe the issue you're experiencing.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query,
          type: 'troubleshooting',
          context: {
            adminSection: 'troubleshooting',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const session: TroubleshootingSession = {
        id: crypto.randomUUID(),
        query,
        steps: data.diagnosticSteps || [],
        analysis: data.analysis || {},
        recommendations: data.recommendedActions || [],
        escalationLevel: data.escalationLevel || 'standard',
        startTime: new Date(),
        status: 'active'
      };

      setCurrentSession(session);
      toast({
        title: "Analysis Started",
        description: "Advanced troubleshooting engine is analyzing the issue."
      });

      // Simulate progressive analysis
      await simulateProgressiveAnalysis(session);
      
    } catch (error) {
      console.error('Troubleshooting error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to start troubleshooting analysis.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [query, toast]);

  const simulateProgressiveAnalysis = async (session: TroubleshootingSession) => {
    // Simulate step-by-step analysis
    for (let i = 0; i < session.steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentSession(prev => {
        if (!prev) return prev;
        const updatedSteps = [...prev.steps];
        updatedSteps[i] = {
          ...updatedSteps[i],
          status: 'completed',
          results: generateStepResults(updatedSteps[i])
        };
        return { ...prev, steps: updatedSteps };
      });
    }

    // Mark session as completed
    setCurrentSession(prev => 
      prev ? { ...prev, status: 'completed' } : prev
    );
  };

  const generateStepResults = (step: DiagnosticStep) => {
    const results = {
      'System Health Check': {
        systemStatus: 'healthy',
        providerHealth: 'good',
        activeAlerts: 2,
        performance: 'optimal'
      },
      'Issue Correlation': {
        similarIssues: 3,
        timePattern: 'peak_hours',
        affectedUsers: 15,
        correlation: 'high'
      },
      'Root Cause Analysis': {
        primaryCause: 'Provider API rate limiting',
        secondaryCauses: ['High traffic volume', 'Cache misses'],
        confidence: 0.85,
        resolution: 'Implement circuit breaker'
      }
    };

    return results[step.step as keyof typeof results] || {};
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProgressPercentage = () => {
    if (!currentSession) return 0;
    const completedSteps = currentSession.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / currentSession.steps.length) * 100;
  };

  const escalationColors = {
    immediate: 'bg-red-500',
    urgent: 'bg-orange-500',
    standard: 'bg-blue-500'
  };

  return (
    <div className="space-y-6">
      {/* Troubleshooting Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Troubleshooting Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Describe the issue you're experiencing..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && startTroubleshooting()}
              disabled={isAnalyzing}
            />
            <Button 
              onClick={startTroubleshooting}
              disabled={isAnalyzing || !query.trim()}
              className="whitespace-nowrap"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze Issue
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Session */}
      {currentSession && (
        <div className="space-y-6">
          {/* Session Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Troubleshooting Session
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary"
                    className={escalationColors[currentSession.escalationLevel as keyof typeof escalationColors]}
                  >
                    {currentSession.escalationLevel.toUpperCase()}
                  </Badge>
                  <Badge variant={currentSession.status === 'completed' ? 'default' : 'secondary'}>
                    {currentSession.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Query:</strong> {currentSession.query}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis Progress</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="diagnostic">Diagnostic Steps</TabsTrigger>
              <TabsTrigger value="analysis">Root Cause</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostic" className="space-y-4">
              {currentSession.steps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(step.status)}
                        <span className="font-medium">{step.step}</span>
                      </div>
                      <Badge variant="outline">
                        Step {index + 1}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Actions:</div>
                      <ul className="text-sm space-y-1">
                        {step.actions.map((action, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="h-1 w-1 bg-current rounded-full" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {step.results && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">Results:</div>
                        <div className="text-sm space-y-1">
                          {Object.entries(step.results).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Root Cause Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Severity</div>
                      <Badge variant={currentSession.analysis.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {currentSession.analysis.severity?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Category</div>
                      <Badge variant="outline">
                        {currentSession.analysis.category?.toUpperCase() || 'SYSTEM'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">User Impact</div>
                      <Badge variant="secondary">
                        {currentSession.analysis.userImpact?.toUpperCase() || 'MODERATE'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Similar Incidents</div>
                      <Badge variant="outline">
                        {currentSession.analysis.similarIncidents || 0} found
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentSession.recommendations.map((action, index) => (
                      <Alert key={index}>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Action {index + 1}:</strong> {action}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="correlation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cross-System Correlation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Analyzing relationships between different system components and recent events...
                  </div>
                  {/* Placeholder for correlation visualization */}
                  <div className="mt-4 p-4 border rounded-lg text-center text-muted-foreground">
                    Correlation analysis will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};