import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Brain, 
  Target,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  LineChart,
  RefreshCw
} from 'lucide-react';

interface Prediction {
  id: string;
  type: 'revenue' | 'demand' | 'performance' | 'risk' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  trend: 'up' | 'down' | 'stable';
  value: number;
  change: number;
  recommendedActions: string[];
  metadata: any;
}

interface AnalyticsProps {
  dashboardType: 'user' | 'partner' | 'admin';
  userId?: string;
}

export const PredictiveAnalytics: React.FC<AnalyticsProps> = ({
  dashboardType,
  userId
}) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-analytics', {
        body: {
          dashboardType,
          userId,
          analysisTypes: ['revenue', 'demand', 'performance', 'risk', 'opportunity']
        }
      });

      if (error) throw error;

      setPredictions(data.predictions || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [dashboardType, userId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="h-5 w-5" />;
      case 'demand':
        return <TrendingUp className="h-5 w-5" />;
      case 'performance':
        return <BarChart3 className="h-5 w-5" />;
      case 'risk':
        return <AlertTriangle className="h-5 w-5" />;
      case 'opportunity':
        return <Target className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'bg-green-100 text-green-800';
      case 'demand':
        return 'bg-blue-100 text-blue-800';
      case 'performance':
        return 'bg-purple-100 text-purple-800';
      case 'risk':
        return 'bg-red-100 text-red-800';
      case 'opportunity':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up' || change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend === 'down' || change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <LineChart className="h-4 w-4 text-gray-600" />;
  };

  const getDashboardSpecificPredictions = () => {
    switch (dashboardType) {
      case 'user':
        return [
          {
            id: 'user-price-drop',
            type: 'opportunity' as const,
            title: 'Price Drop Prediction',
            description: 'Flight prices to Tokyo expected to drop 15% in the next 7 days',
            confidence: 87,
            impact: 'medium' as const,
            timeframe: 'Next 7 days',
            trend: 'down' as const,
            value: 850,
            change: -15,
            recommendedActions: [
              'Set up price alert for Tokyo flights',
              'Consider booking within the next week',
              'Compare with alternative nearby destinations'
            ],
            metadata: { destination: 'Tokyo', currentPrice: 1000 }
          },
          {
            id: 'user-demand-surge',
            type: 'risk' as const,
            title: 'High Demand Period',
            description: 'Hotel availability in Paris will be limited during your planned travel dates',
            confidence: 92,
            impact: 'high' as const,
            timeframe: 'Next 30 days',
            trend: 'up' as const,
            value: 95,
            change: 45,
            recommendedActions: [
              'Book accommodation immediately',
              'Consider alternative dates',
              'Look at nearby cities with better availability'
            ],
            metadata: { destination: 'Paris', demandIncrease: 45 }
          }
        ];
      case 'partner':
        return [
          {
            id: 'partner-revenue-forecast',
            type: 'revenue' as const,
            title: 'Q4 Revenue Forecast',
            description: 'Projected 23% increase in revenue based on current booking trends',
            confidence: 91,
            impact: 'high' as const,
            timeframe: 'Next 3 months',
            trend: 'up' as const,
            value: 245000,
            change: 23,
            recommendedActions: [
              'Increase inventory for peak periods',
              'Optimize pricing strategy',
              'Enhance marketing campaigns'
            ],
            metadata: { currentRevenue: 200000, projectedGrowth: 23 }
          },
          {
            id: 'partner-optimization',
            type: 'opportunity' as const,
            title: 'Pricing Optimization',
            description: 'Room rates can be increased by 12% without affecting occupancy',
            confidence: 78,
            impact: 'medium' as const,
            timeframe: 'Immediate',
            trend: 'up' as const,
            value: 12,
            change: 12,
            recommendedActions: [
              'Implement dynamic pricing',
              'A/B test price increases',
              'Monitor competitor pricing'
            ],
            metadata: { suggestedIncrease: 12, riskLevel: 'low' }
          }
        ];
      case 'admin':
        return [
          {
            id: 'admin-system-load',
            type: 'performance' as const,
            title: 'System Load Prediction',
            description: 'Expected 40% increase in system load during upcoming holiday season',
            confidence: 94,
            impact: 'critical' as const,
            timeframe: 'Next 14 days',
            trend: 'up' as const,
            value: 140,
            change: 40,
            recommendedActions: [
              'Scale server infrastructure',
              'Optimize database queries',
              'Implement additional caching'
            ],
            metadata: { currentLoad: 100, expectedPeak: 140 }
          },
          {
            id: 'admin-bot-efficiency',
            type: 'opportunity' as const,
            title: 'Bot Optimization Opportunity',
            description: 'Analytics bot efficiency can be improved by 18% with configuration updates',
            confidence: 85,
            impact: 'medium' as const,
            timeframe: 'Next 7 days',
            trend: 'up' as const,
            value: 18,
            change: 18,
            recommendedActions: [
              'Update bot configuration parameters',
              'Implement new ML models',
              'Optimize query patterns'
            ],
            metadata: { botId: 'analytics-reporting-manager', improvement: 18 }
          }
        ];
      default:
        return [];
    }
  };

  const mockPredictions = getDashboardSpecificPredictions();
  const allPredictions = [...predictions, ...mockPredictions];

  const groupedPredictions = allPredictions.reduce((acc, prediction) => {
    if (!acc[prediction.type]) {
      acc[prediction.type] = [];
    }
    acc[prediction.type].push(prediction);
    return acc;
  }, {} as Record<string, Prediction[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">
            AI-powered insights and predictions for {dashboardType} dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPredictions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{allPredictions.length}</p>
                <p className="text-xs text-muted-foreground">Active Predictions</p>
              </div>
              <Brain className="h-4 w-4 ml-auto text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">
                  {allPredictions.filter(p => p.confidence > 80).length}
                </p>
                <p className="text-xs text-muted-foreground">High Confidence</p>
              </div>
              <Target className="h-4 w-4 ml-auto text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">
                  {allPredictions.filter(p => p.impact === 'critical' || p.impact === 'high').length}
                </p>
                <p className="text-xs text-muted-foreground">High Impact</p>
              </div>
              <AlertTriangle className="h-4 w-4 ml-auto text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">
                  {(allPredictions.reduce((acc, p) => acc + p.confidence, 0) / allPredictions.length).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
              <BarChart3 className="h-4 w-4 ml-auto text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Predictions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="demand">Demand</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="opportunity">Opportunity</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {allPredictions.map((prediction) => (
              <Card key={prediction.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(prediction.type)}
                      <CardTitle className="text-lg">{prediction.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(prediction.type)}>
                        {prediction.type}
                      </Badge>
                      <Badge className={getImpactColor(prediction.impact)}>
                        {prediction.impact}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{prediction.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Confidence</span>
                      <div className="flex items-center space-x-1">
                        <p className="font-medium">{prediction.confidence}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full" 
                            style={{ width: `${prediction.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Timeframe</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <p className="font-medium">{prediction.timeframe}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Trend</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(prediction.trend, prediction.change)}
                        <p className="font-medium">{Math.abs(prediction.change)}%</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 text-sm">Recommended Actions</span>
                    <div className="mt-2 space-y-1">
                      {prediction.recommendedActions.slice(0, 2).map((action, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                      {prediction.recommendedActions.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{prediction.recommendedActions.length - 2} more actions
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Take Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {Object.entries(groupedPredictions).map(([type, predictions]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {predictions.map((prediction) => (
                <Card key={prediction.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getTypeIcon(prediction.type)}
                      <span>{prediction.title}</span>
                    </CardTitle>
                    <CardDescription>{prediction.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence: {prediction.confidence}%</span>
                        <span>Impact: {prediction.impact}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Timeframe: {prediction.timeframe}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};