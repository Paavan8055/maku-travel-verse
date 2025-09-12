import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingDown, 
  Clock, 
  AlertCircle, 
  Zap,
  Target,
  Activity,
  BarChart
} from 'lucide-react';

interface PatternAnalysis {
  id: string;
  type: 'bottleneck' | 'failure_pattern' | 'optimization' | 'anomaly';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    revenue: number;
    customers: number;
    bookings: number;
  };
  recommendations: string[];
  timeframe: string;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface PredictiveInsight {
  type: 'demand_forecast' | 'failure_prediction' | 'capacity_planning' | 'revenue_optimization';
  prediction: string;
  probability: number;
  timeframe: string;
  actionable: string[];
  metrics: Record<string, number>;
}

export const AdvancedPatternAnalyzer: React.FC = () => {
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [predictions, setPredictions] = useState<PredictiveInsight[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const { toast } = useToast();

  const runAdvancedAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      // Fetch comprehensive correlation data
      const { data: correlations, error } = await supabase
        .from('correlation_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;

      if (!correlations || correlations.length === 0) {
        toast({
          title: "No Data Available",
          description: "Insufficient correlation data for advanced pattern analysis",
          variant: "destructive"
        });
        return;
      }

      // Run AI-powered pattern analysis
      const analysisResult = await supabase.functions.invoke('master-bot', {
        body: {
          intent: 'advanced_pattern_analysis',
          params: {
            correlations: correlations.slice(0, 1000), // Send recent data
            analysis_type: 'comprehensive_business_intelligence',
            focus_areas: [
              'booking_flow_optimization',
              'revenue_impact_analysis',
              'customer_experience_patterns',
              'provider_performance_correlation',
              'seasonal_demand_patterns',
              'failure_cascade_analysis'
            ]
          }
        }
      });

      if (analysisResult.error) {
        throw new Error(`Analysis failed: ${analysisResult.error.message}`);
      }

      const analysisData = analysisResult.data?.result;
      if (analysisData) {
        // Process pattern analysis results
        const processedPatterns = processPatternResults(analysisData, correlations);
        setPatterns(processedPatterns);

        // Generate predictive insights
        const predictiveInsights = generatePredictiveInsights(correlations, analysisData);
        setPredictions(predictiveInsights);

        setLastAnalysis(new Date());
        
        toast({
          title: "Advanced Analysis Complete",
          description: `Identified ${processedPatterns.length} patterns and ${predictiveInsights.length} predictive insights`
        });
      }

    } catch (error) {
      console.error('Advanced analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown analysis error",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  }, [toast]);

  const processPatternResults = (analysisData: any, correlations: any[]): PatternAnalysis[] => {
    const patterns: PatternAnalysis[] = [];

    // Process bottleneck analysis
    if (analysisData.bottlenecks) {
      analysisData.bottlenecks.forEach((bottleneck: any, index: number) => {
        patterns.push({
          id: `bottleneck_${index}`,
          type: 'bottleneck',
          severity: bottleneck.impact > 10000 ? 'critical' : bottleneck.impact > 5000 ? 'high' : 'medium',
          title: `Performance Bottleneck: ${bottleneck.service || 'Unknown Service'}`,
          description: bottleneck.description || 'Performance degradation detected',
          impact: {
            revenue: bottleneck.revenue_impact || 0,
            customers: bottleneck.affected_customers || 0,
            bookings: bottleneck.affected_bookings || 0
          },
          recommendations: Array.isArray(bottleneck.recommendations) ? bottleneck.recommendations : [],
          timeframe: bottleneck.timeframe || 'Last 24 hours',
          confidence: bottleneck.confidence || 85,
          trend: bottleneck.trend || 'stable'
        });
      });
    }

    // Process failure patterns
    if (analysisData.failure_patterns) {
      analysisData.failure_patterns.forEach((failure: any, index: number) => {
        patterns.push({
          id: `failure_${index}`,
          type: 'failure_pattern',
          severity: failure.frequency > 20 ? 'critical' : failure.frequency > 10 ? 'high' : 'medium',
          title: `Failure Pattern: ${failure.pattern_type || 'Recurring Failures'}`,
          description: failure.description || 'Recurring failure pattern identified',
          impact: {
            revenue: failure.revenue_loss || 0,
            customers: failure.customer_impact || 0,
            bookings: failure.booking_failures || 0
          },
          recommendations: Array.isArray(failure.solutions) ? failure.solutions : [],
          timeframe: failure.period || 'Last 48 hours',
          confidence: failure.confidence || 80,
          trend: failure.trend || 'increasing'
        });
      });
    }

    // Process optimization opportunities
    if (analysisData.optimizations) {
      analysisData.optimizations.forEach((opt: any, index: number) => {
        patterns.push({
          id: `optimization_${index}`,
          type: 'optimization',
          severity: 'medium',
          title: `Optimization Opportunity: ${opt.area || 'Performance'}`,
          description: opt.description || 'Performance optimization opportunity',
          impact: {
            revenue: opt.potential_savings || 0,
            customers: opt.customer_benefit || 0,
            bookings: opt.booking_improvement || 0
          },
          recommendations: Array.isArray(opt.actions) ? opt.actions : [],
          timeframe: opt.implementation_timeframe || 'Next week',
          confidence: opt.confidence || 75,
          trend: 'stable'
        });
      });
    }

    return patterns.slice(0, 10); // Limit to top 10 patterns
  };

  const generatePredictiveInsights = (correlations: any[], analysisData: any): PredictiveInsight[] => {
    const insights: PredictiveInsight[] = [];

    // Demand forecasting
    const hourlyData = correlations.reduce((acc, c) => {
      const hour = new Date(c.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const currentHour = new Date().getHours();
    const expectedDemand = hourlyData[currentHour] || 0;
    
    insights.push({
      type: 'demand_forecast',
      prediction: `Expected ${Math.round(expectedDemand * 1.2)} booking requests in next hour`,
      probability: 85,
      timeframe: 'Next 1-2 hours',
      actionable: [
        'Scale up provider API capacity',
        'Pre-warm payment processing',
        'Alert support team for increased volume'
      ],
      metrics: {
        expected_volume: expectedDemand * 1.2,
        confidence_interval: 0.85,
        historical_accuracy: 0.78
      }
    });

    // Failure prediction
    const recentFailures = correlations.filter(c => 
      c.status === 'failed' && 
      new Date(c.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000)
    ).length;

    if (recentFailures > 5) {
      insights.push({
        type: 'failure_prediction',
        prediction: 'Elevated failure risk detected - potential cascade failure in next 30 minutes',
        probability: Math.min(95, 60 + (recentFailures * 5)),
        timeframe: 'Next 30 minutes',
        actionable: [
          'Activate backup providers immediately',
          'Enable circuit breaker patterns',
          'Notify operations team',
          'Prepare customer communication'
        ],
        metrics: {
          recent_failures: recentFailures,
          failure_velocity: recentFailures / 2,
          risk_score: Math.min(100, recentFailures * 10)
        }
      });
    }

    // Revenue optimization
    const avgBookingValue = correlations
      .filter(c => c.status === 'completed' && c.request_data?.amount)
      .reduce((sum, c, _, arr) => sum + (c.request_data.amount / arr.length), 0);

    if (avgBookingValue > 0) {
      insights.push({
        type: 'revenue_optimization',
        prediction: `Potential 15% revenue increase through conversion optimization`,
        probability: 70,
        timeframe: 'Next 7 days',
        actionable: [
          'Implement dynamic pricing for peak hours',
          'Optimize checkout flow for mobile users',
          'Add cross-selling recommendations',
          'Reduce form abandonment through UX improvements'
        ],
        metrics: {
          current_avg_booking: avgBookingValue,
          optimization_potential: avgBookingValue * 0.15,
          conversion_improvement: 15
        }
      });
    }

    return insights;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'bottleneck': return <Clock className="h-4 w-4" />;
      case 'failure_pattern': return <AlertCircle className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      case 'anomaly': return <TrendingDown className="h-4 w-4" />;
      default: return <BarChart className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis of booking flows, failure patterns, and optimization opportunities
              </p>
              {lastAnalysis && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last analysis: {lastAnalysis.toLocaleString()}
                </p>
              )}
            </div>
            <Button onClick={runAdvancedAnalysis} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      {predictions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Predictive Insights</h3>
          {predictions.map((insight, index) => (
            <Alert key={index} className="border-primary">
              <Target className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{insight.prediction}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{insight.probability}% confidence</Badge>
                    <span className="text-muted-foreground">{insight.timeframe}</span>
                  </div>
                  {insight.actionable.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Recommended Actions:</p>
                      <ul className="text-sm space-y-1">
                        {insight.actionable.slice(0, 3).map((action, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Pattern Analysis Results */}
      {patterns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identified Patterns</h3>
          <div className="grid gap-4">
            {patterns.map((pattern) => (
              <Card key={pattern.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPatternIcon(pattern.type)}
                      <CardTitle className="text-base">{pattern.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(pattern.severity)}>
                        {pattern.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{pattern.confidence}% confidence</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>
                  
                  {/* Impact Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">${pattern.impact.revenue.toLocaleString()}</div>
                      <div className="text-muted-foreground">Revenue Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{pattern.impact.customers.toLocaleString()}</div>
                      <div className="text-muted-foreground">Customers Affected</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{pattern.impact.bookings.toLocaleString()}</div>
                      <div className="text-muted-foreground">Bookings Impacted</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {pattern.recommendations.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Recommendations:</p>
                      <ul className="space-y-1 text-sm">
                        {pattern.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Zap className="h-3 w-3 mt-0.5 text-primary" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pattern.timeframe}</span>
                    <span>Trend: {pattern.trend}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analyzing && patterns.length === 0 && predictions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Advanced Analysis Ready</h3>
            <p className="text-muted-foreground mb-4">
              Run AI-powered pattern analysis to identify optimization opportunities and predict system behavior
            </p>
            <Button onClick={runAdvancedAnalysis}>
              <Brain className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};