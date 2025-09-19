import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Lightbulb, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Target,
  Star,
  Zap
} from 'lucide-react';
import { PredictiveInsight } from '@/types/ai-intelligence-types';

interface PredictiveInsightsPanelProps {
  insights: PredictiveInsight[];
  loading: boolean;
  onRefresh: () => void;
}

const getInsightIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'price_alert': <DollarSign className="h-5 w-5 text-green-500" />,
    'next_dream_prediction': <Star className="h-5 w-5 text-purple-500" />,
    'optimal_booking_window': <Calendar className="h-5 w-5 text-blue-500" />,
    'trend_prediction': <TrendingUp className="h-5 w-5 text-orange-500" />,
    'social_recommendation': <Target className="h-5 w-5 text-pink-500" />
  };
  return iconMap[type] || <Lightbulb className="h-5 w-5 text-yellow-500" />;
};

const getUrgencyIcon = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'high':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    default:
      return <Lightbulb className="h-4 w-4 text-blue-500" />;
  }
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return 'border-red-200 bg-red-50';
    case 'high':
      return 'border-orange-200 bg-orange-50';
    case 'medium':
      return 'border-yellow-200 bg-yellow-50';
    default:
      return 'border-blue-200 bg-blue-50';
  }
};

const getActionIcon = (actionType: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'book_now': <Zap className="h-4 w-4 text-green-500" />,
    'wait_for_price_drop': <TrendingDown className="h-4 w-4 text-blue-500" />,
    'add_to_dreams': <Star className="h-4 w-4 text-purple-500" />,
    'share_with_friends': <Target className="h-4 w-4 text-pink-500" />,
    'research_more': <Lightbulb className="h-4 w-4 text-yellow-500" />
  };
  return iconMap[actionType] || <ArrowRight className="h-4 w-4 text-gray-500" />;
};

export const PredictiveInsightsPanel: React.FC<PredictiveInsightsPanelProps> = ({
  insights,
  loading,
  onRefresh
}) => {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const sortedInsights = insights.sort((a, b) => {
    const urgencyOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 
           b.confidence - a.confidence;
  });

  const criticalInsights = insights.filter(i => i.urgency === 'critical');
  const highInsights = insights.filter(i => i.urgency === 'high');
  const totalSavings = insights.reduce((sum, insight) => sum + (insight.predicted_value || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin mb-4">
            <Lightbulb className="h-16 w-16 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Generating Predictive Insights</h3>
          <p className="text-gray-500 text-center">
            Our AI is analyzing trends and patterns to predict future opportunities...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Insights Available</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            AI predictions are generated based on your travel patterns and market data. Check back soon for new insights.
          </p>
          <Button onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-6 w-6 text-blue-500" />
                <span>Predictive Insights</span>
                <Badge variant="secondary">{insights.length} insights</Badge>
              </CardTitle>
              <CardDescription>
                AI-powered predictions to optimize your travel planning and savings
              </CardDescription>
            </div>
            <Button onClick={onRefresh} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Insights</p>
                  <p className="text-2xl font-bold">{insights.length}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-blue-200" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Critical</p>
                  <p className="text-2xl font-bold">{criticalInsights.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">High Priority</p>
                  <p className="text-2xl font-bold">{highInsights.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Potential Savings</p>
                  <p className="text-2xl font-bold">${totalSavings}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {criticalInsights.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Action Required</AlertTitle>
              <AlertDescription>
                You have {criticalInsights.length} time-sensitive insights that require immediate attention.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {sortedInsights.map((insight, index) => (
          <Card key={insight.insight_id} className={`border-l-4 ${getUrgencyColor(insight.urgency)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getInsightIcon(insight.insight_type)}
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{insight.title}</span>
                      <Badge 
                        variant={insight.urgency === 'critical' ? 'destructive' : 
                                insight.urgency === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.urgency}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {insight.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {insight.confidence}% confident
                  </Badge>
                  {insight.predicted_value > 0 && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Save ${insight.predicted_value}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Progress bar for time until expiry */}
              {insight.expires_at && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Time remaining</span>
                    <span>{Math.ceil((new Date(insight.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, 
                      ((new Date(insight.expires_at).getTime() - Date.now()) / (14 * 24 * 60 * 60 * 1000)) * 100
                    ))} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Related Destinations */}
              {insight.related_destinations.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Related Destinations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {insight.related_destinations.map((dest, destIndex) => (
                      <Badge key={destIndex} variant="outline" className="text-xs capitalize">
                        {dest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Steps */}
              {insight.actionable_steps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Recommended Actions</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {insight.actionable_steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start space-x-3 p-3 bg-white border rounded-lg">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                          {step.step_number}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(step.action_type)}
                              <span className="text-sm font-medium">{step.action_text}</span>
                            </div>
                            {step.deadline && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(step.deadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-green-600 font-medium">
                            💡 {step.estimated_impact}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Reasoning - Expandable */}
              <div className="mt-4 pt-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setExpandedInsight(
                    expandedInsight === insight.insight_id ? null : insight.insight_id
                  )}
                  className="text-xs"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {expandedInsight === insight.insight_id ? 'Hide' : 'Show'} AI Reasoning
                </Button>
                
                {expandedInsight === insight.insight_id && (
                  <div className="mt-2 p-3 bg-gray-50 border rounded-lg">
                    <p className="text-sm text-gray-700">{insight.ai_reasoning}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};