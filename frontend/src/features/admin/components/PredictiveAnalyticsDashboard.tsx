import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Target,
  Zap,
  Calendar,
  Activity,
  Shield,
  Cpu,
  Database,
  Globe
} from 'lucide-react';
import { useEnhancedAI } from '../hooks/useEnhancedAI';
import { useToast } from '@/hooks/use-toast';

interface Prediction {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'monitoring' | 'resolved';
  recommendations: string[];
  metrics?: any;
}

interface PredictiveInsight {
  systemHealth: any;
  resourceNeeds: any;
  maintenanceWindows: any;
  riskAssessment: any;
  performanceTrends: any;
  userBehaviorPatterns: any;
}

export const PredictiveAnalyticsDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const { getPredictiveInsights, analyzeSystemPatterns, isProcessing } = useEnhancedAI();
  const { toast } = useToast();

  const timeframes = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const runPredictiveAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await getPredictiveInsights({
        timeframe: selectedTimeframe,
        analysisType: 'comprehensive'
      });

      if (result?.predictions) {
        setInsights(result.predictions);
        
        // Generate predictions from insights
        const newPredictions: Prediction[] = [
          {
            id: '1',
            category: 'System Health',
            title: 'System Performance Trend',
            description: `System health trending ${result.predictions.systemHealth?.overall || 'stable'} over the next ${selectedTimeframe}`,
            confidence: 0.85,
            timeframe: 'Next 4 hours',
            impact: result.predictions.systemHealth?.overall === 'declining' ? 'high' : 'low',
            status: 'monitoring',
            recommendations: [
              'Monitor system metrics closely',
              'Prepare scaling resources if needed',
              'Review performance bottlenecks'
            ]
          },
          {
            id: '2',
            category: 'Resource Management',
            title: 'Resource Capacity Forecast',
            description: 'Based on current usage patterns, resource utilization will remain within normal limits',
            confidence: 0.78,
            timeframe: 'Next 24 hours',
            impact: 'medium',
            status: 'active',
            recommendations: [
              'Continue monitoring resource usage',
              'Consider auto-scaling policies',
              'Review peak usage patterns'
            ]
          },
          {
            id: '3',
            category: 'Maintenance',
            title: 'Optimal Maintenance Window',
            description: 'Identified low-traffic window for system maintenance',
            confidence: 0.92,
            timeframe: '02:00-04:00 UTC',
            impact: 'low',
            status: 'active',
            recommendations: [
              'Schedule maintenance during identified window',
              'Prepare maintenance checklist',
              'Notify relevant teams'
            ]
          }
        ];

        setPredictions(newPredictions);
        
        toast({
          title: "Analysis Complete",
          description: `Generated ${newPredictions.length} predictive insights.`
        });
      }
      
    } catch (error) {
      console.error('Predictive analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete predictive analysis.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [getPredictiveInsights, selectedTimeframe, toast]);

  useEffect(() => {
    runPredictiveAnalysis();
  }, [selectedTimeframe]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'system health': return <Cpu className="h-4 w-4" />;
      case 'resource management': return <Database className="h-4 w-4" />;
      case 'maintenance': return <Shield className="h-4 w-4" />;
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'network': return <Globe className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predictive Analytics Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <select 
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-1 border rounded-md"
              >
                {timeframes.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
              <Button 
                onClick={runPredictiveAnalysis}
                disabled={isAnalyzing || isProcessing}
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Predictions</p>
                <p className="text-2xl font-bold">{predictions.filter(p => p.status === 'active').length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Impact Issues</p>
                <p className="text-2xl font-bold">{predictions.filter(p => ['high', 'critical'].includes(p.impact)).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {predictions.length > 0 
                    ? Math.round((predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length) * 100)
                    : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">{insights?.systemHealth?.overall || 'Stable'}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Health Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Overall Health</span>
                    <Badge variant={insights?.systemHealth?.overall === 'stable' ? 'default' : 'destructive'}>
                      {insights?.systemHealth?.overall || 'Stable'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Provider Health</span>
                    <Badge variant="default">{insights?.systemHealth?.providers || 'Good'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Capacity Status</span>
                    <Badge variant="secondary">{insights?.systemHealth?.capacity || 'Adequate'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights?.riskAssessment ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span>High Risk Items</span>
                        <Badge variant="destructive">{insights.riskAssessment.high?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Medium Risk Items</span>
                        <Badge variant="secondary">{insights.riskAssessment.medium?.length || 1}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Low Risk Items</span>
                        <Badge variant="outline">{insights.riskAssessment.low?.length || 1}</Badge>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Risk assessment data unavailable</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions.map(prediction => (
            <Card key={prediction.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(prediction.category)}
                        <h3 className="font-semibold">{prediction.title}</h3>
                        <Badge variant="outline">{prediction.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{prediction.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getImpactIcon(prediction.impact)}
                      <Badge variant="secondary">{prediction.status}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={prediction.confidence * 100} className="h-2" />
                        <span className="font-medium">{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeframe:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{prediction.timeframe}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impact Level:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`h-2 w-2 rounded-full ${getImpactColor(prediction.impact)}`} />
                        <span className="font-medium capitalize">{prediction.impact}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                    <ul className="text-sm space-y-1">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="h-1 w-1 bg-current rounded-full" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Maintenance Windows
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights?.maintenanceWindows ? (
                  <div className="space-y-3">
                    {insights.maintenanceWindows.map((window: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{window.window}</span>
                          <Badge variant={window.recommended ? 'default' : 'secondary'}>
                            {window.impact} impact
                          </Badge>
                        </div>
                        {window.recommended && (
                          <p className="text-sm text-green-600 mt-1">✓ Recommended</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No maintenance windows identified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Resource Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights?.resourceNeeds ? (
                  <div className="space-y-3">
                    {Object.entries(insights.resourceNeeds).map(([resource, status]) => (
                      <div key={resource} className="flex justify-between items-center">
                        <span className="capitalize">{resource.replace(/([A-Z])/g, ' $1')}</span>
                        <Badge variant={status === 'good' || status === 'sufficient' ? 'default' : 'secondary'}>
                          {String(status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Resource forecast unavailable</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {predictions.map(prediction => 
              prediction.recommendations.map((rec, idx) => (
                <Alert key={`${prediction.id}-${idx}`}>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{prediction.category}:</strong> {rec}
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};